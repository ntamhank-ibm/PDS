
myApp.controller('StatsController', function($scope){
       
    $scope.error_message = '';
    
    $scope.GROUPBY_KEYWORD = 'keyword';
    $scope.GROUPBY_IP = 'ip';
    $scope.GROUPBY_DATE = 'date';
    
    $scope.group_by = 'keyword';
    $scope.secret = '';
    $scope.keyword_data = [];
    $scope.ip_data = [];
    $scope.date_data = [];
    $scope.all_data = [];
    
    $(document).ready(function() {
        doc = $(document);
        if(doc.length > 0){ 
            curUrl = doc[0].location.search;
            qs = curUrl.substring(1);
            paramarray = qs.split('&');
            for(i in paramarray){
                if(paramarray[i].startsWith('group_by=')){
                    $scope.group_by = paramarray[i].split('=')[1];
                    break;
                }
            }
            for(i in paramarray){
                if(paramarray[i].startsWith('secret=')){
                    $scope.secret = paramarray[i].split('=')[1];
                    break;
                }
            }
        }
        $.ajax({
            url: 'getStats?group_by='+$scope.group_by+'&secret='+$scope.secret,
            success: function(data){
                try{
                    if($scope.group_by == $scope.GROUPBY_KEYWORD){
                        $scope.keyword_data = data;
                    }
                    else if ($scope.group_by == $scope.GROUPBY_IP){
                        $scope.ip_data = data;
                    }
                    else if ($scope.group_by == $scope.GROUPBY_DATE){
                        $scope.date_data = data;
                    }
                    else{
                        $scope.all_data = data;
                    }
                }catch(e){
                    $scope.error_message = e.message;
                    console.log(e);
                    console.log(data);
                }
                $scope.$apply();
            },
            failure: function(data){
                console.log("Not able to fetch stats.");         
                $scope.error_message = 'Failed to get stats';            
            }
        });
        
        $(document).ready(function() {
            $scope.questions = new Array(50);
            for(i = 0;i < $scope.questions.length;i++) {
                $scope.questions[i] = false;
            }
        });
    });
    /*
        $.ajax({
            url: 'getStats?group_by='+$scope.group_by,
            success: function(data){
                try{
                    if($scope.group_by == $scope.GROUPBY_KEYWORD){
                        $scope.keyword_data = data;
                    }
                    else if ($scope.group_by == $scope.GROUPBY_IP){
                        $scope.ip_data = data;
                    }
                    else if ($scope.group_by == $scope.GROUPBY_DATE){
                        $scope.keyword_data = data;
                    }
                    else{
                        $scope.all_data = data;
                    }
                }catch(e){
                    $scope.error_message = e.message;
                    console.log(e);
                    console.log(data);
                }
                $scope.$apply();
            },
            failure: function(data){
                console.log("Not able to fetch stats.");         
                $scope.error_message = 'Failed to get stats';            
            }
        });
        
        $(document).ready(function() {
            $scope.questions = new Array(50);
            for(i = 0;i < $scope.questions.length;i++) {
                $scope.questions[i] = false;
            }
        });
*/        

});