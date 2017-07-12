import urllib2
import logging

PDS_BASE = '/opt/PDS/'
DATA_FILE_LOCATION = '%s/distro_data' % PDS_BASE
LOG_FILE_LOCATION = '%s/log/pds.log' % PDS_BASE
MIN_DATA_FILE_SIZE = 50000
MAX_RECORDS_TO_CONCAT = 5000

proxy_user = 'proxy_user'
proxy_password = 'proxy_password'
proxy_server = 'proxy_server'
proxy_port = 'proxy_port'

enable_proxy_authentication = False
server_host = '0.0.0.0'
server_port = 5000

DISABLE_PAGINATION = False

'''
Following are the various debug levels:
CRITICAL
ERROR
WARNING
INFO
DEBUG
NOTSET
Refer https://docs.python.org/2/library/logging.html for more information.
'''
DEBUG_LEVEL = logging.ERROR

SUPPORTED_DISTROS = {
    'Ubuntu': {
        'Ubuntu 16.04': 'Ubuntu_16_04_Package_List.json',
        'Ubuntu 16.10': 'Ubuntu_16_10_Package_List.json',
        'Ubuntu 17.04': 'Ubuntu_17_04_Package_List.json'
    }, 
    'SUSE Linux Enterprise Server': {
        'SUSE Linux Enterprise Server 11 SP4': 'Suse_Linux_Enterprise_Server_11_SP4_Package_List.json',
        'SUSE Linux Enterprise Server 12 SP1': 'Suse_Linux_Enterprise_Server_12_SP1_Package_List.json',
        'SUSE Linux Enterprise Server 12 SP2': 'Suse_Linux_Enterprise_Server_12_SP2_Package_List.json'
    },
    'SUSE Package Hub': {
        'SLES 12 SP1': 'SUSE_Package_Hub_SLES_12_SP1.json',
        'SLES 12 SP2': 'SUSE_Package_Hub_SLES_12_SP2.json',
    }
}

logging.basicConfig(format='%(asctime)s %(message)s', filename=LOG_FILE_LOCATION, level=DEBUG_LEVEL)

LOGGER = logging.getLogger('PDS_SERVER')
   
# In case application is hosted on server with proxy, set "enable_proxy_authentication = True" in config.py 
# and update the proxy details
def proxy_authentication():
    proxy = urllib2.ProxyHandler({'http': 'http://%s:%s@%s:%s' % (proxy_user, proxy_password, proxy_server, proxy_port),
      'https': 'https://%s:%s@%s:%s' % (proxy_user, proxy_password, proxy_server, proxy_port)}
    )
    auth = urllib2.HTTPBasicAuthHandler()
    opener = urllib2.build_opener(proxy, auth, urllib2.HTTPHandler)
    urllib2.install_opener(opener)
