/*##############################################################################

    Copyright (C) 2011 HPCC Systems.

    All rights reserved. This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
############################################################################## */

#option ('applyInstantEclTransformations', true);
#option ('applyInstantEclTransformationsLimit', 999);

person := dataset('person', { unsigned8 person_id, string1 per_sex, string2 per_st, string40 per_first_name, string40 per_last_name}, thor);
output(person(per_st='FL',per_first_name[1..4]='RICH'),NAMED('FloridaFolk'));

x := dataset(workunit('FloridaFolk'),recordof(person));

output(x);
