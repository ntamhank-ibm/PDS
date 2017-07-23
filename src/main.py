from flask import Flask, request, render_template, json
import logging

from config import server_host, server_port
from config import LOGGER, DEBUG_LEVEL
from classes import PackageSearch


app = Flask(__name__)
# Ensure that the required JSON data file are pre-loaded in memory at the time of server start.
package_search = PackageSearch.load()

@app.route('/')
@app.route('/pds/')
def index():
    return render_template('index.html')

@app.route('/getSupportedDistros')
@app.route('/pds/getSupportedDistros')
def getSupportedDistros():
    package_search = PackageSearch.load()
    return json.dumps(package_search.getSupportedDistros())

@app.route('/searchPackages')
@app.route('/pds/searchPackages')
def searchPackages():
    package_search = PackageSearch.load()
    search_term = ''
    exact_match = False
    search_bit_flag = 0
    page_number = 0
    try:
        search_term = str(request.args.get('search_term', ''))
        exact_match = request.args.get('exact_match', False)
        search_bit_flag = int(request.args.get('search_bit_flag', '0'))
        page_number = int(request.args.get('page_number', '0'))
    except Exception as ex:
        LOGGER.error('Error in searchPackages with search parameters: %s', str(ex))

    return package_search.searchPackages(search_term, exact_match, search_bit_flag, page_number)   

# Logic to start flask server if executed via command line.
if __name__ == '__main__':

    if DEBUG_LEVEL == logging.DEBUG:
        app.debug = True

    app.run(host=server_host, port=server_port)
