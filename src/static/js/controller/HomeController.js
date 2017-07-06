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
    $scope.sortingOrder = "";
    $scope.reverse = false;
    $scope.page_options = [5, 10, 20,30, 40, 50];
    $scope.itemsPerPage = 10;
    $scope.no_results_found = '';
    $scope.loading = false;
    
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
                $scope.os_list.push({type:"All",value:false});
                var osversions = [];
                for (supported_os_name in $scope.supported_oses_list_keys)
                {
                    $scope.os_list.push({type:$scope.supported_oses_list_keys[supported_os_name],value:false});
                }
                for(os_name in $scope.supported_oses_list){
                    osversions = Object.keys($scope.supported_oses_list[os_name]);
                    version_array = []
                    for(i = 0;i < osversions.length;i++ ){
                        version_array.push({type:osversions[i], value:true});
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
    $scope.sortKey = 'name';
    
    $scope.request_complete = true;
    
    //$scope.loading = false;
    $scope.toggle = false;
    $scope.empty_resultset_message = '';
    $scope.$watch('toggle', function(){
        $scope.toggleText = $scope.toggle ? '+' : '-';
    });

    $scope.sort_by = function(newSortingOrder) {
        if ($scope.sortingOrder == newSortingOrder)
            $scope.reverse = !$scope.reverse;

        $scope.sortingOrder = newSortingOrder;

        // icon setup
        $('th i').each(function(){
            // icon reset
            $(this).removeClass().addClass('icon-sort');
        });
        if ($scope.reverse)
            $('th.'+newSortingOrder+' i').removeClass().addClass('icon-chevron-up');
        else
            $('th.'+newSortingOrder+' i').removeClass().addClass('icon-chevron-down');
    };

    $scope.setPage = function () {
        $scope.currentPage = this.n;
    };
    
    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.pagedItems.length - 1) {
            $scope.currentPage++;
        }
    };
    
    $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    };
      
     $scope.range = function (size, start, end) {
        var ret = [];        
                      
        if (size < end) {
            end = size;
            start = size-$scope.gap;
            /*if(start < -1){
                start = -1;
            }*/
        }
        for (var i = start; i < end; i++) {
            ret.push(i);
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
        if(tickevent !== undefined && tickevent.target.id === 'chkAll')
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
            //$scope.all[0].value = tickState; 
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
            if($scope.os_list[rec].value){
                for(distro_version_record in $scope.supported_oses_list[$scope.os_list[rec].type]){
                    $scope.search_bit_flag += $scope.supported_oses_list[$scope.os_list[rec].type][distro_version_record]
                }
            }
        }
        $scope.error_message = '';
        $scope.exact_match = psearch_exact;
        $scope.refine_package_name = '';
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
                    };
                    $scope.packages_all = packages_all;
                    $scope.no_results_found = '';
                }
                $scope.refine_package_name = '';
                $scope.filterResults(0);
                //TODO: Show loader
                $scope.loading = false;
                $scope.$apply();
            },
            failure: function(data){
                $scope.loading = false;
                $scope.no_results_found = 'Your search - "'+ decodeURI($scope.package_name) +'" - did not match any package.'
                $scope.$apply();
            },
            error: function(req, response_status){
                $scope.no_results_found = 'There was a issue contacting server please try again later'
                $scope.$apply();
            },
            timeout: 60000 // sets timeout to 60 seconds
          });
    };
    
    
    $scope.filterResults = function(refineCheckEvent){
        if(refineCheckEvent !== undefined && refineCheckEvent === 0){
            console.log('Filtering from main search');
            //This is called from main search - so use AS IS
            $scope.filteredItems = $scope.packages_all;
        }
        else{
            var distro_version_filter = false;
            for(os_name in $scope.os_versions_list){
                for(os_ver_rec in $scope.os_versions_list[os_name]){
                    if($scope.os_versions_list[os_name][os_ver_rec].value){
                        distro_version_filter = true;
                        break;
                    }
                }
            }
            if(distro_version_filter == false && $scope.refine_package_name.length == 0){
                console.log('Refine text is empty and refine distros unticked');
                $scope.filteredItems = $scope.packages_all;
            }
            else if(distro_version_filter == false && $scope.refine_package_name.length > 0){
                console.log('Refine text is PROVIDED and refine distros unticked');
                $scope.filteredItems = $scope.packages_all.filter(function (pkg) {
                    return pkg.P.includes($scope.refine_package_name);
                });
            }
            else if(distro_version_filter == true && $scope.refine_package_name.length > 0){
                console.log('Refine text is PROVIDED and refine distros ticked');
                $scope.filteredItems = $scope.packages_all.filter(function (pkg) {
                    pfound = pkg.P.includes($scope.refine_package_name);
                    if(!pfound){return false;}
                    os_found = false;
                    for(os_name in $scope.os_versions_list){
                        //console.log(os_name); //OS Name
                        if(pkg[os_name] === undefined){
                            continue; //current package does not belong to OS being checked so continue
                        }
                        for(os_ver_rec in $scope.os_versions_list[os_name]){
                            //console.log($scope.os_versions_list['SUSE Package Hub'][os_ver_rec].type); //OS Version
                            if($scope.os_versions_list[os_name][os_ver_rec].value){
                                //OS Ver is ticked
                                if(pkg[os_name].includes($scope.os_versions_list[os_name][os_ver_rec].type)){
                                    os_found = true;
                                    break; //Current package does belong to at least one of the ticked OS Version
                                }
                                else{
                                    continue; //Requested OS Version is not available in this OS of the package
                                }
                            }
                        }
                    }

                    return os_found;
                });
            }
            else if(distro_version_filter == true && $scope.refine_package_name.length == 0){
                console.log('Refine text is empty and refine distros ticked');
                $scope.filteredItems = $scope.packages_all.filter(function (pkg) {
                    os_found = false;
                    for(os_name in $scope.os_versions_list){
                        //console.log(os_name); //OS Name
                        if(pkg[os_name] === undefined){
                            continue; //current package does not belong to OS being checked so continue
                        }
                        for(os_ver_rec in $scope.os_versions_list[os_name]){
                            //console.log($scope.os_versions_list['SUSE Package Hub'][os_ver_rec].type); //OS Version
                            if($scope.os_versions_list[os_name][os_ver_rec].value){
                                //OS Ver is ticked
                                if(pkg[os_name].includes($scope.os_versions_list[os_name][os_ver_rec].type)){
                                    os_found = true;
                                    break; //Current package does belong to at least one of the ticked OS Version
                                }
                                else{
                                    continue; //Requested OS Version is not available in this OS of the package
                                }
                            }
                        }
                    }
                    return os_found;
                });
            }
        }
        if ($scope.sortingOrder !== '') {
            $scope.filteredItems = $filter('orderBy')($scope.filteredItems, $scope.sortingOrder, $scope.reverse);
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
        //var ret = [];
        var distros = '';
        var package_distro_names = Object.keys(package_data);
        for(rec in $scope.os_list){
            searched_distro_name = $scope.os_list[rec].type;
            if(package_distro_names.includes(searched_distro_name)){
                distros += searched_distro_name + ' (' + package_data[searched_distro_name] + '), '
            }
        }
        if(distros.length > 0){
            distros = distros.slice(0, -2);
        }
        return distros;
    };
    
    /* Old functions */
    $scope.fetchPackages = function(my_event, exact_match, page_size, page_number, sort_key, sort_reverse){
        if(my_event !== undefined && my_event !== null){
            var keyCode = my_event.which || my_event.keyCode;
            if (keyCode !== 13) {
               return;
            }
        }
        if(!$scope.is_distro_selected()){
            $(".sub_menu_items_search").find("input[type=text]").blur();
            $scope.error_message = 'No Distros selected!';
        }
        $scope.current_page = (page_number !== undefined)?page_number:1;
        page_size = (page_size === undefined)? $scope.page_size: page_size;
        page_number = (page_number === undefined)? 0: page_number;
        prev_page = $scope.page_number;
        $scope.exact_match = (exact_match !== undefined)?exact_match:$scope.exact_match;
        $scope.page_size = (page_size !== undefined)?page_size:$scope.page_size;
        $scope.page_number = (page_number !== undefined)?page_number:$scope.page_number;
        $scope.sort_key = (sort_key !== undefined)?sort_key:$scope.sort_key;
        $scope.sort_reverse = (sort_reverse !== undefined)?sort_reverse:$scope.sort_reverse;

        $scope.highlightPage();

        // this method is responsible for making a API call to server to fetch required data and render it on UI.
        if(exact_match === undefined){
            exact_match = false;
        }       
        if($scope.package_name.length <= 2 && exact_match !== true){
            return;
        }       

        $scope.selected_distros = [];
        $scope.display_column_list = [];
        $scope.distroIdToVersionMap = {};
        var search_bit_rep = 0;
        $('.flavor_with_version').each(function () {
            if(this.checked){
                $scope.loading = true;
                var self = {};
                self.package_name = encodeURIComponent($scope.package_name);
                distro_string_id = $(this).attr('id'); //Id is 'encoded_os_name' and 'encoded_version' seperated 3 underscores
                distro_reference_string_name = $(this).attr('reference_name'); //reference name is 'os name' and 'version' seperated by -_-
                distro_string_array = distro_string_id.split('___');  //[0] has 'encoded_os_name' and [1] has 'encoded_version'
                distro_reference_string_array = distro_reference_string_name.split('-_-'); //distro_reference_string_array[0] contains 'os name' and [1] contains 'version' and [2] contains bit_rep

                self.display_name = '';
                if(distro_reference_string_array.length == 3 && distro_string_array.length == 2){
                    self.name = distro_reference_string_array[0]; //os name
                    self.display_name = distro_reference_string_array[0]; //os name
                    self.version = distro_reference_string_array[1]; //os version
                    search_bit_rep += $scope.supported_oses_list[self.name][distro_reference_string_array[1]];
                    $scope.selected_distros.push(self);
                    $scope.display_column_list[self.name] = self;
                    if($scope.distroIdToVersionMap[self.name] === undefined){
                        $scope.distroIdToVersionMap[self.name] = {};
                    }
                    $scope.distroIdToVersionMap[self.name][distro_reference_string_array[1]] = distro_reference_string_array[2];
                }
            }
        });

        display_column_list_temp = Object.keys($scope.display_column_list).map(function(key) {
            return $scope.display_column_list[key];
        });
        $scope.display_column_list = display_column_list_temp;
        $scope.fetchDataFromUrl($scope.formatString($scope.selected_distros), search_bit_rep);
    };

    $scope.readableDistroName = function(distro_name){
        return distro_name.replace(/__/, ' ').replace(/_/g,' ');
    };

    $scope.textToVariableNaming = function(distro_name){
        return distro_name.replace(/\./g, '_').replace(/ /g, '_');
    };

    $scope.getPages = function(){
        pages = [];
        var i = $scope.page_number + 1;
        if($scope.page_count <= 3 || i == 1){
            for(var c = 1; c <= $scope.page_count && c <= 3; c++){
                pages.push(c);
            }
        }else if(i >= $scope.page_count){
            pages.push($scope.page_count-2);
            pages.push($scope.page_count-1);
            pages.push($scope.page_count);
        }else{
            pages.push(i-1);
            pages.push(i);
            pages.push(i+1);
        }

        return pages;
    };

    $scope.getDistroVersion = function(distro, supported_os_name){
        bit_rep_dec = distro.B;
        requested_distros = $scope.distroIdToVersionMap[supported_os_name];
        distro_versions = []
        for(var requested_version in requested_distros){
            if((bit_rep_dec & requested_distros[requested_version]) > 0){
                distro_versions.push(requested_version);
            }
        }
        return distro_versions.join(' / ');
    };

    $scope.getSelectedPage = function(){
        $scope.fetchPackages(null, exact_match, page_size, iter);
    };

    //pagination logic for rendering page display on page change.
    $scope.recalculatePagination = function(package_count){
        $scope.totalItems = package_count;
        $scope.page_count = Math.ceil($scope.totalItems*1.0/$scope.page_size);
        $scope.currentPage = 1;
        $scope.maxSize = 5; // Number of pager buttons to show
        $scope.number_of_items = $scope.page_size;
    };
    
    $scope.setItemsPerPage = function(num) {
        $scope.page_size = num;
        $scope.currentPage = 1; // reset to first page
        $scope.fetchPackages(null, $scope.exact_match, $scope.page_size, 1);
    };

    $scope.formatString = function(input_string, variable_obj){
        for (var attr in variable_obj) {
            if(attr !== undefined){
                input_string = input_string.replace("{" + attr + "}", variable_obj[attr]);              
            }
        }
        return input_string;
    };

    $scope.fetchDataFromUrl = function(json_data, search_bit_rep){
        if(json_data.length < 1){
            return;
        }
        if ($scope.sort_key === undefined){
            $scope.sort_key = 'name';
        }

        if($scope.sort_reverse === undefined){
            $scope.sort_reverse = 0;
        }

        bit_search = (search_bit_rep !== undefined)?search_bit_rep:0;

        $scope.page_number = ($scope.page_number <= 0)? 1: $scope.page_number;
        package_name = (json_data.length > 0) ? json_data[0].package_name: '';
        $scope.page_size = ($scope.page_size !== undefined)?$scope.page_size:10;
        new_url = 'getPackagesFromURL?page_size='+$scope.page_size+'&sort_key='+$scope.sort_key+'&reverse='+ $scope.sort_reverse +'&page_number='+$scope.page_number+'&exact_match='+ $scope.exact_match +'&package_name='+package_name+'&search_string='+bit_search;
        if ($scope.prev_url == '' || $scope.prev_url != new_url){
            $scope.prev_url = new_url;
        }else{
            $scope.loading = false;
            return;
        }

        // Get the package information data from the server and process it for display
        $.ajax({
            url: new_url,
            success: function(data){
        try{
                    distro_data = JSON.parse(data);
        }catch(e){
            console.log(e);
            distro_data = data;
        }
                package_count = distro_data.total_packages;
                package_data = distro_data.packages;
                packages_all = [];
                for(var i = 0; i < package_data.length; i++){
                    package_data[i].name = unescape(package_data[i].name);
                    packages_all.push(package_data[i]);
                };

                $scope.packages_all = packages_all;
                $scope.recalculatePagination(package_count);
                $scope.loading = false;
                if(package_count <= 0){
                    $scope.setEmptyMessage('Your search - "'+ unescape(json_data[0].package_name) +'" - did not match any package.');                    
                }

                addDisclaimer(document.getElementById('main_table_container'), $scope.packages_all.length > 0);
                $scope.highlightPage();
                $scope.$apply();
            },
            failure: function(data){
                $scope.loading = false;
                $scope.setEmptyMessage('Your search - "'+ unescape(json_data[0].package_name) +'" - did not match any package.');
                addDisclaimer(null, false, false);
            },
            error: function(req, response_status){
                $scope.error_message = 'There was a issue contacting server please try again later..';
                //$scope.setEmptyMessage('Your search - "'+ unescape(json_data[0].package_name) +'" - did not match any package.');
                $scope.setEmptyMessage('');
                addDisclaimer(null, false, false);
                $scope.loading = false;
                $( "#error_popup" ).dialog({
                    modal: true,
                    buttons: {
                      Ok: function() {
                        $( this ).dialog( "close" );
                      }
                    }
                });
                $scope.$apply();
            },
            timeout: 60000 // sets timeout to 60 seconds
          });
    };

    $scope.distroIdToVersionMap = {};

    $scope.setEmptyMessage = function(msg){   
        // If there is no data returned by API call to server set No result message.
        $(document).ajaxStop(function() {
            if($scope.packages_all.length <= 0){
                $scope.empty_resultset_message = msg;               
            }else{
                $scope.empty_resultset_message = "";
            }
            $scope.loading = false;
            $scope.$apply();
        });
    };
    
    $scope.highlightPage = function(){
        var other_pages = $('#page_number_'+$scope.page_number).siblings();

        for (var i = 0; i < other_pages.length; i++){
            $(other_pages[i]).removeClass('active');
        }

        if($scope.page_number == 1){
            $('#page_number_0').addClass('active');
        }else if($scope.page_number == ($scope.page_count)){
            $('#page_number_'+($scope.page_count+1)).addClass('active');
        }
        $('#page_number_'+$scope.page_number).addClass('active');
    };
    
    $scope.sort_by_old = function(sort_key){
        // Modify the sort key based on selection.
        $scope.sort_key = sort_key;
        $scope.sort_reverse = ! $scope.sort_reverse;
        $scope.exact_match = exact_match;
        $scope.page_size = page_size;
        $scope.page_count = page_count;
        
        // also change the sorting icon
        $('.sorting-arrows').each(function(){
            $(this).addClass('fa-sort');
            $(this).removeClass('fa-sort-desc');
            $(this).removeClass('fa-sort-asc');
        });

        // Now update the selected element to reflect sorting icon and tooltip
        $('i[name=package_'+ $scope.sort_key +']').each(function(){
            if(!$scope.sort_reverse){
                $(this).addClass('fa-sort-desc');
                $(this).removeClass('fa-sort-asc');
                $(this).removeClass('fa-sort');
                $(this).attr("title",'Sort Descending');                
            }else{
                $(this).addClass('fa-sort-asc');
                $(this).removeClass('fa-sort-desc');
                $(this).removeClass('fa-sort');
                $(this).attr("title",'Sort Ascending');
            }                
        });

        $scope.fetchPackages(null, exact_match, page_size, 1, $scope.sort_key, $scope.sort_reverse);
    };
    
};



myApp.controller('HomeController', HomeController);
