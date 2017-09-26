# Steps for configuring the PDS to collect usage statistics

The instructions provided below specify the steps for Ubuntu 16.04/16.10/17.04:

_**NOTE:**_
* make sure you are logged in as user with sudo permissions

### Step 1: Install prerequisite

* For Ubuntu (16.04, 16.10, 17.04):

        sudo apt-get update
        sudo apt-get install -y sqlite3 vim

###  Step 2: PDS Configuration Settings
Following configuration settings should be upated in `/opt/PDS/src/config/config.py`:

        1. Set the directory path to STATS_FILE_LOCATION  - This is the path where PDS will create the Stats database
            e.g STATS_FILE_LOCATION = '/opt/PDS/stats'
        2. Set the secret key value to `STATS_SECRET` - PDS user is expected to pass this value in query string to be able to view certain usage statistics
            e.g. STATS_SECRET = 'VERYCOMPLEXSECRETKEYHERE'

###  Step 3: Apache access log configuration settings
Following configuration settings should be upated in `/opt/PDS/src/config/config.py`:

        1. Append the following line to /etc/apache2/envvars
            export APACHE_PDS_LOG_DIR=/opt/PDS/log$SUFFIX
            
        2. Append the following line to /etc/apache2/conf-available/other-vhosts-access-log.conf
            CustomLog ${APACHE_PDS_LOG_DIR}/pds_access.log pds_log

        3. Append the following line to the /etc/apache2/apache2.conf
            LogFormat "%t %v %h \"%U%q\"" pds_log
        
###  Step 4: Restart Apache
    `sudo apachectl restart`
    

###  Step 4: Check usage statistics
The statistics can be viewed using the following URL

    http://server_ip_or_fully_qualified_domain_name:port_number/pds/stats?group_by=<STATSTYPE>&secret=<Your Secret Key>
    
    Following are valid values for STATSTYPE
        1. keyword
        2. ip
        3. date
    The 'secret' parameter is mandatory to view statistics by 'IP' addresses.  This value must match to the value configured in Step #2 above.
