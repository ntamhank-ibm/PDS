import json
import os
import urllib
import collections
from sets import Set
from config import DATA_FILE_LOCATION, DISABLE_PAGINATION, MAX_RECORDS_TO_CONCAT, LOGGER
from config import SUPPORTED_DISTROS

class PackageSearch:
    package_data = {}
    DISTRO_BIT_MAP = {}
    INSTANCE = None

    @classmethod
    def getDataFilePath(cls):
        '''This method will resolve the distributions data path based on configuration file to give actual 
        location of the file.
        '''
        LOGGER.debug('In getDataFilePath')
        return DATA_FILE_LOCATION
        
    def getSupportedDistros(self):
        LOGGER.debug('In getSupportedDistros')
        return self.loadSupportedDistros()

    @classmethod
    def loadSupportedDistros(cls):
        '''
        Returns list of supported OS distributions in PDS
        '''
        LOGGER.debug('loadSupportedDistros: In loadSupportedDistros')
        
        if(len(cls.DISTRO_BIT_MAP.keys()) > 0):
            return cls.DISTRO_BIT_MAP
            
        bitFlag = 1        
        distroRecord = {}
        for supportedDistroName in SUPPORTED_DISTROS.keys():
            for distroVersion in SUPPORTED_DISTROS[supportedDistroName].keys():
                if(not cls.DISTRO_BIT_MAP.has_key(supportedDistroName)):
                    cls.DISTRO_BIT_MAP[supportedDistroName] = {}
                cls.DISTRO_BIT_MAP[supportedDistroName][distroVersion] = bitFlag
                bitFlag += bitFlag
        return cls.DISTRO_BIT_MAP

    @classmethod
    def get_instance(cls):
        LOGGER.debug('get_instance: In get_instance')
        if not cls.INSTANCE:
            cls.INSTANCE = PackageSearch()
            cls.INSTANCE.DISTRO_BIT_MAP = cls.loadSupportedDistros()
            cls.INSTANCE.package_data = cls.loadPackageData()
            LOGGER.debug('get_instance: Creating singleton instance in get_instance')
        return cls.INSTANCE

    @classmethod
    def load(cls):
        LOGGER.debug('In load')
        return cls.get_instance()

    @classmethod
    def loadPackageData(cls):
        '''
        Returns list of Packages in PDS
        '''

        LOGGER.debug('loadPackageData: In loadSupportedDistros')
        distro_data_file = '%s/cached_data.json' % cls.getDataFilePath()
        try:
            json_data = json.load(open(distro_data_file))           
        except:
            LOGGER.warn('loadPackageData: Loading cached distros data failed generating from scratch')
            LOGGER.debug('loadPackageData: start writing distros data')
            json_data = cls.preparePackageData()
            cached_file = open(distro_data_file, 'w')
            cached_file.write(json.dumps(json_data))
            cached_file.close()
            LOGGER.debug('loadPackageData: end writing distros data')

        LOGGER.debug('loadPackageData: Loading supported distros data')

        return json_data

    def searchPackages(self, search_term, exact_match, search_bit_flag):
        
        LOGGER.debug('searchPackages: In function')
        search_term = urllib.unquote(search_term)

        LOGGER.debug('searchPackages: search_term : %s', search_term)
        LOGGER.debug('searchPackages: exact_match : %s', exact_match)
        
        search_packages_begin_with = str(search_term).endswith('*')
        search_packages_end_with = str(search_term).startswith('*')
        search_anywhere_in_packages = (search_packages_begin_with and search_packages_end_with) or ('*' not in str(search_term))
        
        LOGGER.debug('searchPackages: search_packages_begin_with : %s', search_packages_begin_with)
        LOGGER.debug('searchPackages: search_packages_end_with : %s', search_packages_end_with)
        LOGGER.debug('searchPackages: search_anywhere_in_packages : %s', search_anywhere_in_packages)
        
        search_term = search_term.replace('*', '')
        search_term_ucase = search_term.upper()

        if (exact_match.lower() == 'true'):
            LOGGER.debug('searchPackages: Doing exact search')
            preliminary_results = filter(lambda s: s['P'] == search_term, self.INSTANCE.package_data)
        elif search_anywhere_in_packages:
            LOGGER.debug('searchPackages: Doing Anywhere Search')
            preliminary_results = filter(lambda s: search_term_ucase in s['S'], self.INSTANCE.package_data)
        elif search_packages_begin_with:
            LOGGER.debug('searchPackages: find names that begin with')
            preliminary_results = filter(lambda s: str(s['S']).startswith(search_term_ucase), self.INSTANCE.package_data)
        elif search_packages_end_with:
            LOGGER.debug('searchPackages: find names that end with')
            preliminary_results = filter(lambda s: str(s['S']).endswith(search_term_ucase), self.INSTANCE.package_data)

        LOGGER.debug('searchPackages: Search on package name : %s', len(preliminary_results))

        final_results = filter(lambda s: ((s['B'] & search_bit_flag) > 0), preliminary_results)

        LOGGER.debug('searchPackages: Search on bit rep : %s', len(final_results))

        LOGGER.debug('searchPackages: Applied pagination changes')

        final_data = {
            'total_packages': len(final_results),
            'packages': final_results
        }

        LOGGER.debug('searchPackages: Sending final data to calling function')

        LOGGER.debug(final_data)        

        return json.dumps(final_data)

        
    def getPackagesFromURL(self, package_name, exact_match, page_number, page_size, sort_key = 'name', reverse = 0, distro_bit_search_mapping_vals = 0):
        '''
        This API will try to read from JSON files for various distros 
        and return the filtered set of results based on given search 
        keywords and distros to search from.
        '''
        
        # Allow max page size of 50 and min page size of 10
        if page_size > 50:
            page_size = 50
        elif page_size < 5:
            page_size = 5

        LOGGER.debug('getPackagesFromURL: In function')
        package_name = urllib.unquote(package_name)

        LOGGER.debug('getPackagesFromURL: package_name figured out: %s', package_name)

        LOGGER.debug('getPackagesFromURL: bit rep generated : %s', distro_bit_search_mapping_vals)

        actual_package_name = package_name.replace('*', '')
        package_name_ucase = actual_package_name.upper()

        if exact_match:
            matches_based_on_package_name = filter(lambda s: s['P'] and s['P'] == actual_package_name, self.INSTANCE.package_data)
        elif ((str(package_name).startswith('*') and str(package_name).endswith('*')) or '*' not in str(package_name)):
            matches_based_on_package_name = filter(lambda s: s['S'] and package_name_ucase in s['S'], self.INSTANCE.package_data)
        elif str(package_name).endswith('*'):
            matches_based_on_package_name = filter(lambda s: s['S'] and str(s['S']).startswith(package_name_ucase), self.INSTANCE.package_data)
        elif str(package_name).startswith('*'):
            matches_based_on_package_name = filter(lambda s: s['S'] and str(s['S']).endswith(package_name_ucase), self.INSTANCE.package_data)

        LOGGER.debug('getPackagesFromURL: Search on package name : %s', len(matches_based_on_package_name))

        matches_based_on_search = filter(lambda s: ((s['B'] & distro_bit_search_mapping_vals) > 0), matches_based_on_package_name)

        LOGGER.debug('getPackagesFromURL: Search on bit rep : %s', len(matches_based_on_search))

        matches_based_on_search = sorted(matches_based_on_search, key = lambda k:k['P'], reverse = reverse)
        LOGGER.debug('getPackagesFromURL: Sorting done')

        if DISABLE_PAGINATION:
            start = 0
            end = len(matches_based_on_search)
        elif page_number:
            start = (page_number*page_size) - page_size
            end = (page_number*page_size)
        else:
            start = 0
            end = page_size

        LOGGER.debug('getPackagesFromURL: Applied pagination changes')

        final_data = {
            'total_packages': len(matches_based_on_search),
            'packages': matches_based_on_search[start: end]
        }

        LOGGER.debug('getPackagesFromURL: Sending final data to calling function')

        LOGGER.debug(final_data)        

        return json.dumps(final_data)

    @classmethod
    def preparePackageData(cls):
        data_dir = cls.getDataFilePath()
        package_info = [];
        package_data = {};
        cachedPackage = {}
        
        for distroName in SUPPORTED_DISTROS.keys():
            for distroVersion in SUPPORTED_DISTROS[distroName].keys():
                distro_file = SUPPORTED_DISTROS[distroName][distroVersion]
            
                package_info = json.load(open('%s/%s' % (data_dir, distro_file)))
                distro_file_name = distro_file                  
                
                for pkg in package_info:
                    try:
                        pkg_key = pkg["packageName"] + '_' + pkg["version"]
                    except Exception as ex:
                        LOGGER.error('preparePackageData: key not found for package %s' % str(ex))
                    if not package_data.has_key(pkg_key):
                        cachedPackage = {}
                        cachedPackage["P"] = pkg["packageName"]
                        cachedPackage["S"] = cachedPackage["P"].lower().upper()
                        cachedPackage["V"] = pkg["version"]
                        try:
                            cachedPackage["B"] = cls.DISTRO_BIT_MAP[distroName][distroVersion]
                        except Exception as e:
                            raise #This occurrs only if there is a problem with how SUPPORTED_DISTROS is configured in config py

                        cachedPackage[distroName] = [distroVersion]
                        package_data[pkg_key] = cachedPackage
                    else:
                        if not package_data[pkg_key].has_key(distroName):
                            package_data[pkg_key][distroName] = [distroVersion]
                            package_data[pkg_key]['B'] += cls.DISTRO_BIT_MAP[distroName][distroVersion]
                        else:
                            if distroVersion not in package_data[pkg_key][distroName]:
                                package_data[pkg_key][distroName].append(distroVersion)
                                package_data[pkg_key]['B'] += cls.DISTRO_BIT_MAP[distroName][distroVersion]
                                
        json_data = package_data.values()

        return json_data
