import sqlite3
import sys
from datetime import tzinfo, timedelta, datetime
from urlparse import parse_qs, urlparse
from config import STATS_FILE_LOCATION, STATS_SECRET

class PDSStats:
    stats_db_path = STATS_FILE_LOCATION + '/pdslog.db'
    INSTANCE = None   
    
    @classmethod
    def get_instance(cls):
        if not cls.INSTANCE:
            cls.INSTANCE = PDSStats()
        return cls.INSTANCE

    @classmethod
    def load(cls):
        return cls.get_instance()
        
    
    def getStats(self, group_by, secret = ''):
        self.collectStats()
        conn = sqlite3.connect(self.stats_db_path) 
        cursor = conn.cursor()
        all_stats = []
        if group_by == 'keyword':
            sql = 'SELECT keyword, count(*) as searchcount FROM log GROUP BY keyword ORDER BY 2 DESC;'
            cursor = conn.execute(sql);
            keyword_dictionary = {}
            all_stats = []
            for row in cursor:
                kd = {}
                kd['keyword'] = row[0]
                kd['usage'] = row[1]                
                all_stats.append(kd)
                
        elif group_by == 'ip':
            all_stats = []
            if (secret != STATS_SECRET or len(secret.strip()) == 0):
                return all_stats
            
            sql = 'SELECT ip, count(*) AS usage FROM log GROUP BY ip ORDER BY usage DESC;'
            cursor = conn.execute(sql);
            keyword_dictionary = {}
            all_stats = []
            
            for row in cursor:
                kd = {}
                kd['ip'] = row[0]
                kd['usage'] = row[1]                
                all_stats.append(kd)
                
        elif group_by == 'date':
            sql = 'SELECT  date(logtime) logdate, count(*) as usage FROM log GROUP BY logdate ORDER BY 2 DESC;'
            cursor = conn.execute(sql);
            keyword_dictionary = {}
            all_stats = []
            for row in cursor:
                kd = {}
                kd['date'] = row[0]
                kd['usage'] = row[1]                
                all_stats.append(kd)
                
        elif group_by == 'none':
            all_stats = []
            
        return all_stats
    
    def collectStats(self):
        conn = sqlite3.connect(self.stats_db_path) #Python creates the database if it does not exist
        cursor = conn.cursor()
        '''
        Create schema if not already created
        '''
        schema_sql = 'CREATE TABLE IF NOT EXISTS logmeta (lastline int not null);' 
        cursor.execute(schema_sql)
        
        
        schema_sql = 'CREATE TABLE IF NOT EXISTS log(ID int  primary key not null,servername text, ip text, url text, keyword text, filter int, logtime timestamp);'
        cursor.execute(schema_sql)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        '''
        It is important to close and re-open the connection when tables are re-created they are not immediately available for use
        '''
        conn = sqlite3.connect(self.stats_db_path)        
        cursor = conn.cursor()
        cursor = conn.execute("select max(lastline) as lastline from logmeta");
        lastLine = 0
        for row in cursor:
            lastLine = row[0]

        if(lastLine == 0):	            
                schema_sql = 'INSERT INTO logmeta (lastline) VALUES(0);' 
                cursor.execute(schema_sql)

        allLogEntries = []
        newLastLine = 0
        with open('/opt/PDS/log/pds_access.log', 'r') as logFile:
            allLogEntries = logFile.readlines()
            logFile.close()

        newLastLine = len(allLogEntries)
        if(lastLine == newLastLine):
            conn.close()
            sys.exit('No new logs')
            
        logEntries = allLogEntries[lastLine:]

        monthNames = {}
        monthNames['Jan'] = 1
        monthNames['Feb'] = 2
        monthNames['Mar'] = 3
        monthNames['Apr'] = 4
        monthNames['May'] = 5
        monthNames['Jun'] = 6
        monthNames['Jul'] = 7
        monthNames['Aug'] = 8
        monthNames['Sep'] = 9
        monthNames['Oct'] = 10
        monthNames['Nov'] = 11
        monthNames['Dec'] = 12
        rowID = lastLine

        for logEntry in logEntries:
            logData = logEntry.split(' ')
            if (len(logData) == 5):
                tTime = logData[0].replace('[','').replace(':','/').split('/')
                tTZ = logData[1].replace(']','')
                HostIP = logData[2]
                ClientIP = logData[3]
                tURL = logData[4].replace('"','')
                urlData = parse_qs(urlparse(tURL).query, keep_blank_values=True) 
                keyword = ''
                if(urlData.has_key('search_term')):
                    keyword = urlData['search_term'][0]
                filter = ''
                if(urlData.has_key('search_bit_flag')):
                    filter = urlData['search_bit_flag'][0]
                yearVal =  int(tTime[2])
                monthVal =  int(monthNames[tTime[1]])
                dateVal = int(tTime[0])
                hhVal = int(tTime[3])
                mmVal = int(tTime[4])
                ssVal = int(tTime[5])
                #print '%s %s %s %s %s %s ' % (type(yearVal), type(monthVal), type(dateVal), type(hhVal), type(mmVal), type(ssVal))
                dt = datetime(yearVal, monthVal, dateVal,hhVal,mmVal,ssVal)
                rowID = rowID + 1
                if(len(keyword) > 0):
                    conn.execute('insert into log (ID,servername,ip,url,keyword,filter,logtime) values(?,?,?,?,?,?,?)',(rowID, HostIP, ClientIP, tURL,keyword,filter,dt));
                    conn.commit()
                #print "Total number of rows inserted :", conn.total_changes

        conn.execute('update logmeta set lastline = ' + str(newLastLine));
        conn.commit()
        #print "Total number of rows updated :", conn.total_changes
        conn.close()
