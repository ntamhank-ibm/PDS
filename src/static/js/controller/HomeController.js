/**
 * This controller involves fetching and rendering of search results.  
 * @param $scope
 */ 
var HomeController = function($scope) {

    // List of supported OS and versions
    $scope.supported_oses_list = [];
    $scope.supported_oses_list_keys = [];
    $scope.page_size = 10;
    $scope.number_of_items = 10;
    $scope.page_number = 1;
    $scope.current_page = 1;
    $scope.distro_selected = false;
    $scope.display_column_list = [];
    $scope.prev_url = '';
    $scope.selected_distros = [];
    
    $scope.all = []; 
    $scope.os_list = []; 
    $scope.refine_os_list = [];
    $scope.os_versions_list = []; 
    $scope.current_set = []; 
    $scope.search_bit_flag = 0;
    $scope.filteredItems = [];
    $scope.groupedItems = [];
    $scope.pagedItems = [];
    $scope.currentPage = 0;
    $scope.gap = 3;  
    $scope.refine_package_name = '';
    $scope.package_name = '';
    $scope.sortingOrder = "S";
    $scope.reverse = false;
    $scope.page_options = [5, 10, 20,30, 40, 50];
    $scope.itemsPerPage = 10;
    $scope.no_results_found = '';
    $scope.loading = false;
    $scope.os_wise_accordion = [];
    $scope.os_wise_accordion_checkboxes = [];
    
    // Get the package information data from the server and process it for display
    $.ajax({
        url: 'getSupportedDistros',
        success: function(data){
            try{
                $scope.supported_oses_list = JSON.parse(data);
            }catch(e){
                console.log(e);
                $scope.supported_oses_list = data;
            }
                $scope.supported_oses_list_keys = Object.keys($scope.supported_oses_list);
                $scope.all.push({type:"All",value:false}); 
                $scope.os_list = [];
                $scope.os_list.push({type:"All",value:false});
                var osversions = [];
                for (supported_os_name in $scope.supported_oses_list_keys)
                {
                    $scope.os_list.push({type:$scope.supported_oses_list_keys[supported_os_name],value:false});
                    tempName = $scope.supported_oses_list_keys[supported_os_name];
                    $scope.os_wise_accordion[tempName] = true;
                    $scope.os_wise_accordion_checkboxes[tempName] = true;
                }
                for(os_name in $scope.supported_oses_list){
                    osversions = Object.keys($scope.supported_oses_list[os_name]);
                    version_array = []
                    for(i = 0;i < osversions.length;i++ ){
                        version_array.push({type:osversions[i], value:true, count:0, filtercount:0});
                    }
                    $scope.os_versions_list[os_name] = version_array;
                }
                $scope.$apply();
            },
            failure: function(data){
                console.log("Not able to fetch Supported Distros information.");                
            }
      });

    if($scope.packages_all === undefined){
        $scope.packages_all = [];
    }
    
    $scope.set_sort_order = function(newSortingOrder) {
        if ($scope.sortingOrder == newSortingOrder)
            $scope.reverse = !$scope.reverse;

        $scope.sortingOrder = newSortingOrder;
        $scope.orderBy();
        $scope.currentPage = 0;
        $scope.n = 0;
        $scope.groupToPages();
    };
    
    $scope.orderBy = function() {
       $scope.filteredItems.sort(function(a, b){
            var nameA=a[$scope.sortingOrder], nameB=b[$scope.sortingOrder]
            if(!$scope.reverse){
                if (nameA < nameB) //sort string ascending
                    return -1;
                if (nameA > nameB)
                    return 1;
            }
            else{
                if (nameA < nameB) //sort string ascending
                    return 1;
                if (nameA > nameB)
                    return -1;
            }
            return 0 //default return value (no sorting)
        })
    };

    $scope.setPage = function () {
        $scope.currentPage = this.n;
    };
    
    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.pagedItems.length - 1) {
            $scope.currentPage++;
        }
    };
    
    $scope.lastPage = function () {
        $scope.currentPage = $scope.pagedItems.length - 1;
    };
    
    $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    };
    
    $scope.firstPage = function () {
        $scope.currentPage= 0;
    };
      
     $scope.range = function (size, start, end) {
        var ret = [];

        if (size < end) {
          end = size;
          start = size - $scope.gap;
        }
        for (var i = start; i < end; i++) {
          if(i >= 0){
            ret.push(i);
          }
        }
        return ret;
    };

    $scope.is_distro_selected = function(){
        at_least_one_distro_selected = false;
        for(rec in $scope.os_list){
            if($scope.os_list[rec].value){
                at_least_one_distro_selected = true;
                break;
            }
        }
        if(at_least_one_distro_selected){
            $scope.error_message = '';
        }
        return at_least_one_distro_selected;
    };

    $scope.tickUntick = function(tickevent){
        var tickState = true;
        if(tickevent.target.id === 'chkAll')
        {
            var tickState = $('#chkAll').prop("checked");
            for(rec in $scope.os_list){
                $scope.os_list[rec].value = tickState;
            }
        }
        else
        {
            for(rec in $scope.os_list){
                if($scope.os_list[rec].type !== 'All'){
                    if(!$scope.os_list[rec].value){
                        tickState = false;
                        break;}
                }
            }
            $scope.os_list[0].value = tickState; 
        }
        $scope.is_distro_selected(); //this would clear error message just in case
    };
    
    $scope.searchPackagesFromText = function(pevent) {
        if(pevent !== undefined && pevent !== null){
            var keyCode = pevent.which || pevent.keyCode;
            if (keyCode !== 13) {
               return;
            }
        }
        if($scope.package_name.length >= 3){
            $scope.searchPackages();
        }
        else{
            return;
        }
    };
    $scope.searchPackages = function(pevent, pcalled_from, psearch_exact) {
        if(pevent !== undefined && pevent !== null){
            var keyCode = pevent.which || pevent.keyCode;
            if (keyCode !== 13) {
               return;
            }
        }
        if(!$scope.is_distro_selected()){
            $scope.error_message = 'No Distros selected!';
            return;
        }
        else{
            $scope.error_message = '';
        }
        $scope.loading = true;
        var search_bit_flag = 0;
        for(rec in $scope.os_list){
            if($scope.os_list[rec].type != 'All'){
                if(!$scope.os_list[rec].value){
                    /* This needs to be done because, previous search may have refined based on certain distro versions and this search has not selected that distro, so to avoid incorrect refinement, just exlude these specific versions*/
                    for(distro_version_record in $scope.os_versions_list[$scope.os_list[rec].type]){
                        $scope.os_versions_list[$scope.os_list[rec].type][distro_version_record]['value'] = false;
                    }
                }
                else {
                    for(distro_version_record in $scope.supported_oses_list[$scope.os_list[rec].type]){
                        search_bit_flag += $scope.supported_oses_list[$scope.os_list[rec].type][distro_version_record]
                    }
                }
            }
        }
        $scope.search_bit_flag  = search_bit_flag;
        $scope.error_message = '';
        if(psearch_exact === undefined){
            psearch_exact = false;
        }
        $scope.exact_match = psearch_exact;
        $scope.callSearchAPI();
    };
    
    $scope.callSearchAPI = function(){
        if($scope.package_name.length < 1){
            return;
        }
        api_request_url = 'searchPackages?search_term='+$scope.package_name+'&exact_match='+$scope.exact_match+'&search_bit_flag='+ $scope.search_bit_flag;
        if ($scope.prev_url == '' || $scope.prev_url != api_request_url){
            $scope.prev_url = api_request_url;
        }else{
            $scope.loading = false;
            return;
        }

        // Get the package information data from the server and process it for display
        $.ajax({
            url: api_request_url,
            success: function(data){
                try{
                    distro_data = JSON.parse(data);
                }
                catch(e){
                    console.log(e);
                    distro_data = data;
                }
                package_count = distro_data.total_packages;
                if(package_count == 0){
                    $scope.no_results_found = 'Your search - "'+ decodeURI($scope.package_name) +'" - did not match any package.'
                    $scope.packages_all = [];
                }
                else{
                    package_data = distro_data.packages;
                    packages_all = [];
                    for(var i = 0; i < package_data.length; i++){
                        package_data[i].P = decodeURI(package_data[i].P);
                        packages_all.push(package_data[i]);
                    }
                    $scope.packages_all = packages_all;
                    $scope.no_results_found = '';
                }
                $scope.computePackageCount(false); //Make an initial 'distro version wise' count
                $scope.refine_os_list = [];
                
                for (v_os in $scope.os_list) {
                    if ($scope.os_list[v_os].type !== 'All' && $scope.os_list[v_os].value) {
                        $scope.refine_os_list.push({type: $scope.os_list[v_os].type, value: $scope.os_list[v_os].value});
                    }
                }
                $scope.filterResults();
                $scope.loading = false;
                $scope.$apply();
            },
            failure: function(data){
                $scope.loading = false;
                $scope.no_results_found = 'Your search - "'+ decodeURI($scope.package_name) +'" - did not match any package.'
                $scope.$apply();
            },
            error: function(req, response_status){
                $scope.loading = false;
                $scope.no_results_found = 'There was a issue contacting server please try again later'
                $scope.$apply();
            },
            timeout: 120000 // sets timeout to 120 seconds
          });
    }
    
    $scope.computePackageCount = function(countFiltered){
        for(os_name in $scope.os_versions_list){
            for(os_ver_rec in $scope.os_versions_list[os_name]){
                if(!countFiltered){
                    $scope.os_versions_list[os_name][os_ver_rec].count = 0; 
                }
                $scope.os_versions_list[os_name][os_ver_rec].filtercount = 0; //Always reset filtered count
            }
        }
        
        temp_packages = $scope.packages_all;
        if(countFiltered){
            temp_packages = $scope.filteredItems;
        }
        
        for(i = 0;i < temp_packages.length;i++) {
            pkg = temp_packages[i];
            //console.log(JSON.stringify(pkg));
            for(os_name in $scope.os_versions_list){
                if(pkg[os_name] === undefined){
                    continue; //current package does not belong to OS being checked so continue
                }
                else{
                    for(os_ver_rec in $scope.os_versions_list[os_name]){
                        //console.log(JSON.stringify($scope.os_versions_list[os_name][os_ver_rec]));
                        if(pkg[os_name].indexOf($scope.os_versions_list[os_name][os_ver_rec].type) >= 0){
                            if(countFiltered){
                                $scope.os_versions_list[os_name][os_ver_rec].filtercount += 1;
                            }
                            else{
                                $scope.os_versions_list[os_name][os_ver_rec].count += 1;
                            }
                        }
                    }
                }
            }
        }
    }
    
    $scope.filterResults = function(fromMainSearch){
        if(fromMainSearch !== undefined || fromMainSearch ){
            console.log('Filtering from main search');
            $scope.filteredItems = $scope.packages_all;
        }
        else{
            var distro_version_filter = false;
            for(os_name in $scope.os_versions_list){
                for(os_ver_rec in $scope.os_versions_list[os_name]){
                    if($scope.os_versions_list[os_name][os_ver_rec].value){
                        distro_version_filter = true;
                    }
                }
            }
            if(distro_version_filter == false){
                console.log('Refine distros unticked');
                $scope.filteredItems = [];
            }
            else if(distro_version_filter == true){
                $scope.filteredItems = $scope.packages_all.filter(function (pkg) {
                    pfound = pkg.P.indexOf($scope.refine_package_name)>=0 || pkg.V.indexOf($scope.refine_package_name)>=0;
                    if(!pfound){return false;}
                    os_found = false;
                    for(os_name in $scope.os_versions_list){
                        //console.log(os_name); //OS Name
                        if(pkg[os_name] === undefined){
                            continue; //current package does not belong to OS being checked so continue
                        }
                        else{
                            for(os_ver_rec in $scope.os_versions_list[os_name]){
                                //console.log($scope.os_versions_list[os_name][os_ver_rec].type); //OS Version
                                if($scope.os_versions_list[os_name][os_ver_rec].value){
                                    //OS Ver is ticked
                                    if(pkg[os_name].indexOf($scope.os_versions_list[os_name][os_ver_rec].type) >= 0){
                                        os_found = true;
                                        return os_found;
                                    }
                                }
                            }
                        }
                    }
                    return os_found;
                });
            }
        }
        
        $scope.computePackageCount(true); //Count the results per distro version after filter is applied
        
        if ($scope.sortingOrder !== '') {
            $scope.orderBy();
        }
        $scope.currentPage = 0;
        $scope.n = 0;
        $scope.groupToPages();
    }
    
     // calculate page in place
    $scope.groupToPages = function () {
        $scope.pagedItems = [];
        
        for (var i = 0; i < $scope.filteredItems.length; i++) {
            if (i % $scope.itemsPerPage === 0) {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
            } else {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
            }
        }
    };
    
    $scope.getDisplayDistro = function(package_data){
        var distros = '';
        var tmpPkgDistros = [];
        var package_distro_names = Object.keys(package_data);
        for(rec in $scope.os_list){
            tmpPkgDistros = [];
            searched_distro_name = $scope.os_list[rec].type;
            if(package_distro_names.indexOf(searched_distro_name) >= 0){
                for(v in package_data[searched_distro_name]) {
                    tmpPkgDistros.push(package_data[searched_distro_name][v]);
                }
                $scope.os_versions_list[searched_distro_name].filter(function (rec) { 
                    if(!rec.value){
                        idx = tmpPkgDistros.indexOf(rec.type);
                            if(idx >= 0) {
                                tmpPkgDistros.splice(idx,1);
                            }
                        }
                    return;
                    }
                );
                if(tmpPkgDistros.length > 0) {
                    distros += searched_distro_name + ' (' + tmpPkgDistros + '), ';
                }
            }
        }
        if(distros.length > 0){
            distros = distros.slice(0, -2);
        }
        return distros;
    };
    
    $scope.sortIcon = function(display_field) {
        if(display_field === $scope.sortingOrder){
            if($scope.reverse){
                return "icon-chevron-up";
            }
            else{
                return "icon-chevron-down";
            }
        }
        else
        {
            return "icon-sort";
        }
    };
   
    $scope.toggle_child_filters = function(os_name) {
        $scope.os_wise_accordion[os_name] = !$scope.os_wise_accordion[os_name];
    };
    
    $scope.tickUntickRefineCheckboxes = function(os_name) {
        //console.log($scope.os_versions_list[os_name]);
        for(v in $scope.os_versions_list[os_name]) {
            //console.log(v);
            //console.log($scope.os_versions_list[os_name][v]);
            $scope.os_versions_list[os_name][v]['value'] = $scope.os_wise_accordion_checkboxes[os_name];
        }
        $scope.filterResults();
    }
    
    $scope.display_child_filters = function(os_name) {
        return $scope.os_wise_accordion[os_name];
    };
    
};

myApp.controller('HomeController', HomeController);
