################################################################################
#    Copyright (C) 2011 HPCC Systems.
#
#    All rights reserved. This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
################################################################################


# - Try to find the Boost regex library
# Once done this will define
#
#  BOOST_REGEX_FOUND - system has the Boost regex library
#  BOOST_REGEX_INCLUDE_DIR - the Boost regex include directory
#  BOOST_REGEX_LIBRARIES - The libraries needed to use Boost regex
#  BOOST_REGEX_LIBRARY_DIR - The directory containing libraries needed to use Boost regex

IF (NOT BOOST_REGEX_FOUND)
  IF (UNIX)
    SET (boost_regex_lib "boost_regex-mt")
    IF(Boost_USE_STATIC_LIBS)
      SET (boost_regex_lib "libboost_regex-mt.a")
    ENDIF()
  ELSEIF(WIN32)
    SET (boost_regex_lib "libboost_regex-vc90-mt.lib") # note - this may not be the lib we need, but should be in same place as it...
  ENDIF()
  IF (NOT ${EXTERNALS_DIRECTORY} STREQUAL "")
    IF (UNIX)
      IF (${ARCH64BIT} EQUAL 1)
        SET (osdir "linux-x86_64-gcc4")
      ELSE()
        SET (osdir "linux-i686-gcc4")
      ENDIF()
    ELSEIF(WIN32)
      SET (osdir "windows-i386-vc90")
    ELSE()
      SET (osdir "unknown")
    ENDIF()
    IF (NOT ("${osdir}" STREQUAL "unknown"))
      FIND_PATH (BOOST_REGEX_INCLUDE_DIR NAMES boost/regex.h PATHS "${EXTERNALS_DIRECTORY}/boost/include" NO_DEFAULT_PATH)
      FIND_LIBRARY (BOOST_REGEX_LIBRARIES NAMES ${boost_regex_lib} PATHS "${EXTERNALS_DIRECTORY}/boost/${osdir}/lib" NO_DEFAULT_PATH)
    ENDIF() 
  ENDIF()

  # if we didn't find in externals, look in system include path
  if (USE_NATIVE_LIBRARIES)
     SET(Boost_ADDITIONAL_VERSIONS "1.44.0")
     set(Boost_USE_MULTITHREADED ON)
     find_package( Boost COMPONENTS regex )
     if(Boost_FOUND)
         set(BOOST_REGEX_LIBRARIES ${Boost_LIBRARIES})
         set(BOOST_REGEX_INCLUDE_DIR ${Boost_INCLUDE_DIRS})
     endif()
  endif()

  include(FindPackageHandleStandardArgs)
  find_package_handle_standard_args(BOOST_REGEX DEFAULT_MSG
    BOOST_REGEX_LIBRARIES 
    BOOST_REGEX_INCLUDE_DIR
  )

  IF (BOOST_REGEX_FOUND)
    STRING(REPLACE "/${boost_regex_lib}" "" BOOST_REGEX_LIBRARY_DIR "${BOOST_REGEX_LIBRARIES}")
    IF (WIN32)
      set (BOOST_REGEX_LIBRARIES "")  # the actual library to use is controlled by boost header files
    ENDIF()
  ENDIF()
  MARK_AS_ADVANCED(BOOST_REGEX_INCLUDE_DIR BOOST_REGEX_LIBRARIES)
ENDIF()
