
//Class to reptresent FanpageData

var routerApp;
var SERVER = 'https://dev-machine.com:8000';
var FIELDLIST = ['original_id', 'name', 'description', 'location_street', 'location_city', 'location_state', 'location_country', 'location_zip', 'location_latitude', 'location_longitude', 'price_range', 'phone', 'about',
    'checkins', 'cover', 'is_community_page', 'is_published', 'likes', 'link', 'username', 'were_here_count', 'parking_street', 'parking_lot', 'parking_valet', 'hours', 'payment_amex',
    'payment_cash_only', 'payment_discover', 'payment_mastercard', 'payment_visa', 'website', 'attire', 'category', 'category_list', 'emails', 'food_styles', 'is_always_open', 'is_permanently_closed', 'is_unclaimed', 'is_verified', 'public_transit',
    'restaurant_services_delivery', 'restaurant_services_catering', 'restaurant_services_groups', 'restaurant_services_kids', 'restaurant_services_outdoor', 'restaurant_services_takeout', 'restaurant_services_waiter', 'restaurant_services_walkins',
    'restaurant_services_reserve', 'restaurant_specialities_breakfast', 'restaurant_specialities_coffee', 'restaurant_specialities_dinner', 'restaurant_specialities_drinks', 'restaurant_specialities_lunch','picture']
var ADDITIONAL_FIELDLIST = ['id', 'flagged_mask','insta_url','fsqr_url','yelp_url','gplus_url','insta_picture','fsqr_picture',
    'cover_uploaded','picture_uploaded','insta_uploaded', 'fsqr_uploaded'];
var REQUIRED_FIELDS = ['name','link','phone',''];
//var OBSERVABLE_LIST =['insta_url', 'fsqr_url','yelp_url']
var WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
var businessHours;

/// loader decorator
function showLoadingDecorator(f){
    return function() {
        $('#divLoading').addClass('show');
        f.apply(this, arguments);
        $('#divLoading').removeClass('show');
    }
}
function showLoader(waitTime){
    waitTime = (waitTime)?waitTime:2000;
    $('#divLoading').addClass('show');
    setTimeout(function() {
        $('#divLoading').removeClass('show');
    }, waitTime)
}

function hideLoader(){
    $('#divLoading').removeClass('show');
}

function WhereProViewModel(){

    var self = this;

    // FanpagesList Model
    self.fanpagesList     = ko.observableArray();
    self.selectedFanpage   =  ko.observable();


    //FanpageData Model
    self.fanpageData = ko.observable();

    self.instagramList = ko.observableArray();
    self.yelpList = ko.observableArray();
    self.fsqrList = ko.observableArray();
    self.categoryList = ko.observableArray();
    self.priceRangeList = [
        { price :'$$$$ (50+)'},
        { price :'$$$ (30-50)'},
        { price :'$$ (10-30)'},
        { price :'$ (0-10)'}
    ];
    // Observable variables for showing pages
    self.showSelectFanpage = ko.observable(false);
    self.showLoginPage     = ko.observable(false);
    self.showFanpageData   = ko.observable(false);

    self.showImgCloseButton = function(field){
        if ( field =='insta'){
            return false;
        }
    };
    //

    function hideAllPages(){
        self.showFanpageData(false);
        self.showSelectFanpage(false);
        self.showLoginPage(false);
    }


    /*************
     // Behaviours
     ************/
    function goToLogin(){location.hash = "#"}
    self.goToLogin = function(){goToLogin();};
    self.goToSelectFanpage = function(){location.hash = "selectFanpage"};
    self.goToEditFanpageN = function(pg){
        location.hash = "fanpage/" + self.selectedFanpage() + "/" + pg;
        FB.Canvas.scrollTo(0, 0);
    };
    self.goToEditFanpage = function(){
        if (self.selectedFanpage()) {
            location.hash = "fanpage/" + self.selectedFanpage();
        };
        FB.Canvas.scrollTo(0, 0);
    }

    self.uploadPhoto = function(event, sender){
        var field = sender.target.dataset.field;
        if (!field) return;
        function ajaxFileUpload (data) {
            showLoader();
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/upload", true);
            xhr.addEventListener("load", function (e) {
                // file upload is complete
                console.log(xhr.responseText);
                //    alert(sender);

                var respond = $.parseJSON(xhr.responseText);
                if (!respond.error){
                    event[field] = '/uploads/temp/' + respond.image;
                    self.fanpageData(event);
                }
                hideLoader();
            });
            xhr.send(data);
        };

        var inputFile = $('#file');
        //inputFile.files = '';

        inputFile.change( function() {  // Image Selected
            if (!inputFile[0].value){
                return;
            }
            var fdata = new FormData ();
            fdata.append('photo', document.getElementById("file").files[0]);
            ajaxFileUpload(fdata);
            //alert(inputFile[0].value);
            inputFile[0].value = '';
            inputFile.unbind('change');
        });
        inputFile.trigger('click');

    };


    self.closePhoto = function(event, sender){
        var dataset = sender.target.parentElement.dataset;
        if (dataset.field){
            if (event[dataset.field]){
                event[dataset.field] = null;
            } else{
                event[dataset.rtrvdfield] = null;
            }
            self.fanpageData(event);
        }
    };

    //POST DATA TO SERVER
    self.save = showLoadingDecorator(function() {
        if (!self.fanpageData().isValid()){
            alert("Input not correct. Please make sure all required fields are filled out correctly");
            return;
        }
        showLoader();
        //alert( ko.toJSON( self.fanpageData ));
        self.fanpageData().category_list($('#addCategory').multipleSelect("getSelects").join(','));
        self.fanpageData().callBeforeToJSON();
        /*
         var url = 'data:text/json;charset=utf8,' + encodeURIComponent( ko.toJSON( self.fanpageData) );
         window.open(url, '_blank');
         window.focus();
         */
        var type = (self.fanpageData().id != null)?'patch':'post';
        var urlend = (self.fanpageData().id != null)?'/' + self.fanpageData().original_id() : '';
        $.ajax("api/facebook_app_dump" + urlend , {
            data: ko.toJSON(self.fanpageData),
            type: type, contentType: "application/json",
            success: function (result) {
                //alert(result)
                self.goToEditFanpageN(3);
                hideLoader();

            }
        });
    });


    /***************
     //Events
     **************/
    self.selectionChanged = function(event,sender) {
        if (sender.target.id == 'insta_url') {
            var index = self.instagramList().map(function (e) {return e.id;}).indexOf(event.insta_url);
            event.insta_picture = self.instagramList()[index].profile_picture;
            self.fanpageData(event);
        }
        if (sender.target.id == 'fsqr_url') {
            //var index = self.instagramList().map(function (e) {return e.id;}).indexOf(event.insta_url);
            $.post(SERVER + '/extapi/fsqrsrch',
                {venueid: event.fsqr_url} , function(data){
                    data = $.parseJSON(data);
                    event.fsqr_picture = (data.url)?data.url:null;
                    self.fanpageData(event);
                });
        }
    };


    /*******************************
     * Prepare for Fanpage EDIT
     * ***************************/


    self.fillSocialSelect = function(fanpage, data, url, si, list){
        var selectedItem = fanpage[si]
        $.post(SERVER + url, data, function(data){
            data = $.parseJSON(data);
            var mapped = $.map(data, function(item) { return new ListItem(item) });
            list(mapped);
            fanpage[si] =selectedItem;
            self.fanpageData(fanpage)
        });
    };

//-----------------------------------------------
    self.fillCategoryList = function(){
        function parseList(data){
            if (data=='' || data==null){
                return [];
            }
            data = data.match(/(?:[^,"]+|"[^"]*")+/g);
            var mappedCategory = $.map(data, function(item) { return item.trim() });
            mappedCategory = $.unique(mappedCategory);
            return mappedCategory;
        }
        $.post(SERVER + '/extapi/categorylist', {category:self.fanpageData().category()} , function(data){
            var select = $("#addCategory");
            var data = $.parseJSON(data);
            //var selected = self.fanpageData().
            self.categoryList(parseList(data));
            select.multipleSelect({
                selectAll: false,
                minimumCountSelected: 10,
                multiple: true,
                multipleWidth: 300
            });
            select.multipleSelect();

            select.multipleSelect("setSelects", parseList(self.fanpageData().category_list()));
        });
    };
//----------------------------------------
    self.setBusinessHours = function(){
        var hours = self.fanpageData().hours();
        var operationTime = [], re, isActive, timeFrom, timeTill, res;
        for (d in WEEKDAYS){
            re = new RegExp(WEEKDAYS[d] + "_\\d_(\\w+)=(\\d+:\\d+)","g");
            isActive = false;
            timeFrom = null;
            timeTill = null;
            for (var i in [1,2]) {
                res = re.exec(hours);
                if (res != null){
                    isActive = true;
                    if (res[1]=='open'){
                        timeFrom = res[2];
                    }
                    if (res[1]=='close'){
                        timeTill = res[2];
                    }
                }
            }
            operationTime.push({'isActive':isActive,"timeFrom":timeFrom,"timeTill":timeTill})
            //alert(data);
        }



        businessHours =   $("#businessHours").businessHours({
            operationTime: operationTime,
            postInit:function(){

                $('.operationTimeFrom, .operationTimeTill').timepicker({
                    'timeFormat': 'H:i',
                    'step': 15
                });
            },
            dayTmpl:'<div class="dayContainer" style="width: 60px;">' +
            '<div data-original-title="" class="colorBox"><input type="checkbox" class="invisible operationState"></div>' +
            '<div class="weekday"></div>' +
            '<div class="operationDayTimeContainer">' +
            '<div class="operationTime input-group"><span class="input-group-addon"><i class="fa fa-sun-o"></i></span><input type="text" name="startTime" class="mini-time form-control operationTimeFrom" value=""></div>' +
            '<div class="operationTime input-group"><span class="input-group-addon"><i class="fa fa-moon-o"></i></span><input type="text" name="endTime" class="mini-time form-control operationTimeTill" value=""></div>' +
            '</div></div>'
        });
        /*
         businessHours = $('#businessHours').businessHours({
         operationTime: operationTime,           // list of JSON objects

         //checkedColorClass: "workingBusinssDay", // optional
         //uncheckedColorClass: "dayOff",          // optional

         });
         */
    }

    /*******************************************
     * Client-Side Routes
     * ***************************************/
    routerApp = Sammy(function(){
        this.get('/', function () {
            hideAllPages();
            self.showLoginPage(true);
        });

        // FANPAGE SELECT
        this.get('#selectFanpage', function () {
            function getAccounts(){
                FB.api('/me/accounts', function (response) {
                    if (response.error) {
                        goToLogin();
                    }
                    var mappedPages = $.map(response['data'], function (item) {
                        return new ListItem(item)
                    });
                    self.fanpagesList(mappedPages);
                    hideAllPages();
                    self.showSelectFanpage(true);
                })
            };

            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    getAccounts();
                } else if (response.status === 'not_authorized') {
                    FB.login(function(resp) {

                        if (!resp.authResponse) return;
                        getAccounts();

                    }, {scope: 'manage_pages'});
                } else {
                    // the user isn't logged in to Facebook.
                }
            });

        });
        //FANPAGE EDIT
        this.get('#fanpage/:fanpageId',function(response){
            var fanpageId = this.params.fanpageId;
            FB.api(fanpageId
                + '?fields=emails,name,description,location,price_range,phone,about,checkins,cover,is_community_page,is_published,likes,link,username,were_here_count,parking,hours,payment_options,website,attire,category,category_list,is_permanently_closed,is_unclaimed,is_verified,public_transit,restaurant_services,restaurant_specialties,food_styles,is_always_open,picture', function(response) {
                var fanpage = new FanpageData(response);
                FB.api("/" +fanpageId + "/picture?width=180&height=180",  function(response) { //Get big profile picture
                    //Trying to get data from our server api
                    fanpage.picture(response.data.url);
                    $.getJSON("/api/facebook_app_dump/" + fanpageId, function(allData) {
                        if ('id' in allData){

                            fanpage.loadData(allData);
                            //if (!fanpage.checkFlaggedField('picture')) fanpage.picture = response.data.url;
                        }
                    }).always(function(){
                        var data = {latlng:fanpage.location_latitude() + ',' + fanpage.location_longitude(),
                            name:fanpage.name(),
                            city:fanpage.location_city()};
                        self.fillSocialSelect(fanpage, data, '/extapi/instasrch','insta_url',self.instagramList);
                        self.fillSocialSelect(fanpage, data, '/extapi/fsqrsrch','fsqr_url',self.fsqrList);
                        self.fillSocialSelect(fanpage, data, '/extapi/yelpsrch','yelp_url',self.yelpList);
                        self.fanpageData(fanpage);
                        self.setBusinessHours();
                        self.fillCategoryList();
                        pagerFanpage(1);
                        hideAllPages();
                        self.showFanpageData(true);
                        initMap(fanpage);
                    });

                });
            });






        });

        //FANPAGE PAGER
        function pagerFanpage(pg){
            $('#fs1').hide();
            $('#fs2').hide();
            $('#fs3').hide();
            $('#fs'+pg).show();

            $("#progressbar li").eq(pg+1).removeClass("active");
            $("#progressbar li").eq(pg).removeClass("active");
            $("#progressbar li").eq(pg-1).addClass("active");

        }
        this.get('#fanpage/:fanpageId/:Page',function(response){
            var pg = this.params.Page;
            pagerFanpage(pg);

            //alert(this.params.Page);
        });

    });
}

$(document).ready(function() {
    ko.validation.init({
        grouping: {
            deep: true,
            live: true,
            observable: true
        },
        decorateInputElement: true,
        errorElementClass: 'alert-fld',
        insertMessages : false
    });

    ko.applyBindings(new WhereProViewModel());

});


// List model
function ListItem(data){
    for (var x in data){
        this[x]=data[x];
    }
}

//MODEL FOR FANPAGE
function FanpageData(data){
    var self = this;

    // Fields initiation
    for ( k in FIELDLIST){
        this[FIELDLIST[k]] = ko.observable(null);
    }
    for ( k in ADDITIONAL_FIELDLIST){
        this[ADDITIONAL_FIELDLIST[k]] = null;
    }
    // Parsing FACEBOOK API JSON
    for ( x in data) {
        switch (x) {
            case 'picture':
                this['picture'](data.picture.data.url);
                break;
            case 'location':
                for (l in data.location) {
                    this['location_' + l](data.location[l]);
                }
                break;
            case 'restaurant_specialties':
                for (l in data.restaurant_specialties) {
                    this['restaurant_specialties_' + l](data.restaurant_specialties[l]);
                }
                break;
            case 'restaurant_services':
                for (l in data.restaurant_specialties) {
                    this['restaurant_services_' + l](data.restaurant_services[l]);
                }
                break;
            case 'parking':
                for (l in data.restaurant_specialties) {
                    this['parking_' + l](data.parking[l]);
                }
                break;
            case 'payment_options':
                for (l in data.payment_options) {
                    this['payment_' + l](data.payment_options[l]);
                }
                break;

            case 'category_list':
                this.category_list(data.category_list.map(function (a) {
                    return a['name']
                }).join(','))
                break;
            case 'hours':
                var hours = '';
                for (key in data.hours) {
                    hours += ((this.hours != '') ? ',' : '') + key + '=' + data.hours[key];
                }
                this.hours(hours)
                break;
            case 'emails':
                this.emails(data.emails.join(';'));
                break;
            case 'food_styles':
                this.food_styles(data.food_styles.join(','));
                break;
            case 'cover':
                this.cover(data.cover.source);
                break;
            case 'id':
                this.original_id(data.id);
                break;
            default:
                this[x](data[x]);
        }
    }

    //save respond from facebook api, to compare it with a model, before sending to server!
    var __initialData = JSON.parse(JSON.stringify(this));



    // Function for Updating field from wherepro API
    this.loadData = function (data) {
        if ('id' in data) {
            var flagged_mask = data['flagged_mask'].toString(2);

            while(flagged_mask.length<FIELDLIST.length){
                flagged_mask = '0' + flagged_mask;
            }

            for ( k in data) {
                if (( FIELDLIST.indexOf(k)>-1 && flagged_mask[FIELDLIST.indexOf(k)]=='1')  || (ADDITIONAL_FIELDLIST.indexOf(k)>-1)) {
                    if (FIELDLIST.indexOf(k)>-1){
                        self[k](data[k]);
                    }else {
                        self[k] = data[k];
                    }

                }
            }
            self.flagged_mask = flagged_mask;
        }
    };

    function recalcFlagedFields(){
        self.flagged_mask = '';
        for (var k in FIELDLIST){
            self.flagged_mask +=  (__initialData[FIELDLIST[k]]!=self[FIELDLIST[k]]())? '1':'0';

        }
        self.flagged_mask = parseInt(self.flagged_mask, 2);
    }

    function getBusinessHours(){
        var week = businessHours.serialize(), hours='';
        for (d  in WEEKDAYS){
            if ( week[d]['isActive'] == true){
                hours += WEEKDAYS[d] + '_1_open=' + week[d]['timeFrom'] +';' +
                    WEEKDAYS[d] + '_1_close=' + week[d]['timeTill'] +';' ;
            }

        }
        self.hours(hours);
    }

    this.callBeforeToJSON = function(){
        delete self.validationObject;
        getBusinessHours();
        recalcFlagedFields();

    };

    this.checkFlaggedField = function(fieldName){
        return self.flagged_mask[FIELDLIST.indexOf(fieldName)]=='1'
    };

    var validationObject = ko.validatedObservable({
        name: self.name.extend({required: true}),
        link: self.link.extend({required: true}),
        phone: self.phone.extend({required: true}),
        emails: self.emails.extend({required: true,email:true}),
        website: self.website.extend({required: true})
    });

    self.isValid = function(){
        return validationObject.isValid();
    }

}

