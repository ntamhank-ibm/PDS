from flask import Flask, request, render_template, json
import logging

from config import server_host, server_port
from config import LOGGER, DEBUG_LEVEL
from classes import PackageSearch


app = Flask(__name__)
# Ensure that the required JSON data file are pre-loaded in memory at the time of server start.
package_search = PackageSearch.load()

@app.route('/pds/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/pds/getSupportedDistros')
def getSupportedDistros():
    package_search = PackageSearch.load()
    return json.dumps(package_search.getSupportedDistros())

@app.route('/pds/searchPackages')
def searchPackages():
    package_search = PackageSearch.load()
    try:
        search_term = str(request.args.get('search_term', ''))
        exact_match = request.args.get('exact_match', False)
        search_bit_flag = int(request.args.get('search_bit_flag', '0'))
    except Exception as ex:
        LOGGER.error('Error in searchPackages with search parameters: %s', str(ex))

    return package_search.searchPackages(search_term, exact_match, search_bit_flag)
    
@app.route('/pds/getPackagesFromURL')
def getPackagesFromURL():
    '''
    This API will try to read from JSON files for various distros 
    and return the filtered set of results based on given search 
    keywords and distros to search from.
    '''

    package_search = PackageSearch.load()
    package_name = str(request.args.get('package_name', ''))
    search_string = int(request.args.get('search_string', ''))
    print search_string
    LOGGER.debug(request.args.get('package_name', ''))
    try:
        exact_match = json.loads(request.args.get('exact_match', 0))
        page_number = int(request.args.get('page_number', 10))
        page_size = int(request.args.get('page_size', 0))
        reverse = int(json.loads(request.args.get('reverse', 0)))
        sort_key = str(request.args.get('sort_key', 'name'))
    except Exception as ex:
        LOGGER.error('Error in getPackagesFromURL with search parameters: %s', str(ex))

    return package_search.getPackagesFromURL(package_name, exact_match, page_number, page_size, sort_key, reverse, search_string)

# Logic to start flask server if executed via command line.
if __name__ == '__main__':

    if DEBUG_LEVEL == logging.DEBUG:
        app.debug = True

    app.run(host=server_host, port=server_port)
