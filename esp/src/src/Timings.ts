import { Workunit } from "@hpcc-js/comms";
import * as hpccCommon from "@hpcc-js/common";
import { WUTimeline } from "@hpcc-js/eclwatch";
import { Column } from "@hpcc-js/chart";
import { ascending as d3Ascending } from "d3-array";

const d3Select = (hpccCommon as any).select;

export class Timings {
    private wu: Workunit;

    private timeline = new WUTimeline()
        .overlapTolerence(1)
        .baseUrl("")
        .request({
            ScopeFilter: {
                MaxDepth: 2,
                ScopeTypes: []
            },
            NestedFilter: {
                Depth: 0,
                ScopeTypes: []
            },
            PropertiesToReturn: {
                AllProperties: true,
                AllStatistics: true,
                AllHints: true,
                Properties: ["WhenStarted", "TimeElapsed"]
            },
            ScopeOptions: {
                IncludeId: true,
                IncludeScope: true,
                IncludeScopeType: true
            },
            PropertyOptions: {
                IncludeName: true,
                IncludeRawValue: true,
                IncludeFormatted: true,
                IncludeMeasure: true,
                IncludeCreator: true,
                IncludeCreatorType: false
            }
        })
        .on("click", (row, col, sel) => {
            this.refresh();
        })
        ;

    private chart = new Column()
        .yAxisDomainLow(0 as any)
        .yAxisTickFormat("s")
        ;

    private metricsSelect;

    constructor(wuid: string, timelineTarget: string, chartTarget: string, metricsSelectTarget: string) {
        this.wu = Workunit.attach({ baseUrl: "" }, wuid);
        this.timeline
            .target(timelineTarget)
            .wuid(wuid)
        this.chart
            .target(chartTarget)
            ;
        this.metricsSelect = d3Select(`#${metricsSelectTarget}`);
    }

    selectedMetrics() {
        this._metricSelectValue = this.metricsSelect.selectAll("option").nodes()
            .filter(n => n.selected === true)
            .map(n => n.value)
            ;
        return this._metricSelectValue;
    }

    init(wuid: string) {
    }

    protected walkScopeName(id: string, visitor: (name: string) => boolean) {
        const parts = id.split(":");
        while (parts.length > 1) {
            parts.pop();
            if (visitor(parts.join(":"))) {
                break;
            }
        }
    }

    graphID(id: string): string | undefined {
        let retVal: string;
        this.walkScopeName(id, partialID => {
            retVal = this._graphLookup[partialID];
            if (retVal) return true;
        });
        return retVal;
    }

    subgraphID(id: string): string {
        let retVal: string;
        this.walkScopeName(id, partialID => {
            retVal = this._subgraphLookup[partialID];
            if (retVal) return true;
        });
        return retVal;
    }

    _scopeFilter: string = "";
    _metricSelectLabel: string = "";
    _metricSelectValue: string[] = ["TimeElapsed"];
    _graphLookup: { [id: string]: string } = {};
    _subgraphLookup: { [id: string]: string } = {};
    fetchDetailsNormalizedPromise;
    refresh(force: boolean = false) {
        if (force) {
            this.timeline
                .clear()
                .on("click", (row, col, sel) => {
                    this._scopeFilter = sel ? row.__lparam.ScopeName : undefined;
                    this.click(row, col, sel);
                })
                .render()
                ;
        }
        if (force || !this.fetchDetailsNormalizedPromise) {
            this.fetchDetailsNormalizedPromise = Promise.all([this.wu.fetchDetailsMeta(), this.wu.fetchDetailsRaw({
                ScopeFilter: {
                    MaxDepth: 999999,
                    ScopeTypes: []
                },
                NestedFilter: {
                    Depth: 999999,
                    ScopeTypes: []
                },
                PropertiesToReturn: {
                    AllProperties: true,
                    AllStatistics: true,
                    AllHints: true,
                    Properties: []
                },
                ScopeOptions: {
                    IncludeId: true,
                    IncludeScope: true,
                    IncludeScopeType: true
                },
                PropertyOptions: {
                    IncludeName: true,
                    IncludeRawValue: true,
                    IncludeFormatted: true,
                    IncludeMeasure: true,
                    IncludeCreator: false,
                    IncludeCreatorType: false
                }
            })]).then(promises => {
                const meta = promises[0];
                const scopes = promises[1];
                const columns: { [id: string]: any } = {
                    id: {
                        Measure: "label"
                    },
                    name: {
                        Measure: "label"
                    },
                    type: {
                        Measure: "label"
                    }
                };
                const data: object[] = [];
                for (const scope of scopes) {
                    const props = {};
                    if (scope && scope.Id && scope.Properties && scope.Properties.Property) {
                        for (const key in scope.Properties.Property) {
                            const scopeProperty = scope.Properties.Property[key];
                            if (scopeProperty.Measure === "ns") {
                                scopeProperty.Measure = "s";
                            }
                            columns[scopeProperty.Name] = { ...scopeProperty };
                            delete columns[scopeProperty.Name].RawValue;
                            delete columns[scopeProperty.Name].Formatted;
                            switch (scopeProperty.Measure) {
                                case "bool":
                                    props[scopeProperty.Name] = !!+scopeProperty.RawValue;
                                    break;
                                case "sz":
                                    props[scopeProperty.Name] = +scopeProperty.RawValue;
                                    break;
                                case "s":
                                    props[scopeProperty.Name] = +scopeProperty.RawValue / 1000000000;
                                    break;
                                case "ns":
                                    props[scopeProperty.Name] = +scopeProperty.RawValue;
                                    break;
                                case "ts":
                                    props[scopeProperty.Name] = new Date(+scopeProperty.RawValue / 1000).toISOString();
                                    break;
                                case "cnt":
                                    props[scopeProperty.Name] = +scopeProperty.RawValue;
                                    break;
                                case "cpu":
                                case "skw":
                                case "node":
                                case "ppm":
                                case "ip":
                                case "cy":
                                case "en":
                                case "txt":
                                case "id":
                                case "fname":
                                default:
                                    props[scopeProperty.Name] = scopeProperty.RawValue;
                            }
                            props["__" + scopeProperty.Name] = scopeProperty.Formatted;
                        }
                        data.push({
                            id: scope.Id,
                            name: scope.ScopeName,
                            type: scope.ScopeType,
                            ...props
                        });
                    }
                }
                return {
                    meta,
                    columns,
                    data
                };
            });
        }

        return this.fetchDetailsNormalizedPromise.then(response => {
            this._graphLookup = {};
            this._subgraphLookup = {};
            var data = response.data.filter(row => {
                if (row.type === "graph") this._graphLookup[row.name] = row.id;
                if (row.type === "subgraph") this._subgraphLookup[row.name] = row.id;
                if (!row.id) return false;
                if (this._scopeFilter && row.name !== this._scopeFilter && row.name.indexOf(`${this._scopeFilter}:`) !== 0) return false;
                if (this._metricSelectValue.every(m => row[m] === undefined)) return false;
                return true;
            }).sort(function (l, r) {
                if (l.WhenStarted === undefined && r.WhenStarted !== undefined || l.WhenStarted < r.WhenStarted) return -1;
                if (l.WhenStarted !== undefined && r.WhenStarted === undefined || l.WhenStarted > r.WhenStarted) return 1;
                if (l.id < r.id) return -1;
                if (l.id > r.id) return 1;
                return 0;
            });

            var measure = "";
            var colArr = [];
            for (var key in response.columns) {
                if (response.columns[key].Measure && response.columns[key].Measure !== "label") {
                    colArr.push(key)
                }
            }
            colArr.sort(d3Ascending);
            this._metricSelectLabel = this._metricSelectValue + (measure ? " (" + measure + ")" : "");
            var options = this.metricsSelect.selectAll("option").data(colArr, function (d) { return d; });
            options.enter().append("option")
                .merge(options)
                .property("value", d => d)
                .property("selected", d => this._metricSelectValue.indexOf(d) >= 0)
                .text(d => d)
                ;
            options.exit().remove();

            this.chart
                .columns(["id", ...this._metricSelectValue])
                .data(data.filter((row, i) => row.name !== this._scopeFilter).map((row, i) => {
                    return [row.id, ...this._metricSelectValue.map(metric => row[metric])];
                }))
                ;

            return [this._metricSelectValue, data];
        });
    }

    resizeTimeline() {
        this.timeline
            .resize()
            .lazyRender()
            ;
    }

    resizeChart() {
        this.chart
            .resize()
            .lazyRender()
            ;
    }

    //  Events ---
    click(row, col, sel) {
    }
}
