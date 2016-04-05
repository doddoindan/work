from flask import Blueprint, request
from app import app, CATEGORY_LIST, cache
from instagram.client import InstagramAPI
from yelpapi import YelpAPI
from foursquare import  Foursquare
import json, time
from app.Utils import log_errors, cache_key

import urllib2, urllib

mod_extapi = Blueprint('extapi', __name__, url_prefix='/extapi')

caching_time = app.config['CACHING_TIME']




@log_errors
def get_api_url(url, **options):
    data = {}
    for key in options:
        data[key] = options[key]
    url_values = urllib.urlencode(data)
    response = urllib2.urlopen(url + '?' + url_values)
    return response.read()

@log_errors
def checkLatLng(latlng):
    try:
        # "46.42664,30.71803"
        #print latlng
        arr = str(latlng).split(",")
        if abs(float(arr[0])) > 90 or abs(float(arr[1])) > 180:
            return False
    except Exception, e:
        return False
    return True


########NSTAGRAM

@mod_extapi.route('/instasrch', methods=[ 'POST'])
@cache.cached(timeout=caching_time, key_prefix=cache_key)
#@log_errors
def instasearch():
    name = request.form['name'];
    #url = "https://api.instagram.com/v1/users/search"
    #response = get_api_url(url, q=name, client_id=app.config['INSTAGRAM_CLIENT_ID'], count=10)
    api = InstagramAPI(client_id=app.config['INSTAGRAM_CLIENT_ID'])
    response = api.user_search(q=name,count=20)
    response = [ { 'name': d.full_name + '(' + d.username +')', 'id':d.id,'profile_picture':d.profile_picture} for d in response]
    return json.dumps(response)


######### YELP

@mod_extapi.route('/yelpsrch', methods=[ 'POST'])
@cache.cached(timeout=caching_time, key_prefix=cache_key)
@log_errors
def yelpsearch():
    latlng = request.form['latlng'];
    name   = request.form['name'];
    city   = request.form['city'];
    yelp_api = YelpAPI(app.config['YELP_CONSUMER_KEY'], app.config['YELP_CONSUMER_SECRET'],
                       app.config['YELP_TOKEN'], app.config['YELP_TOKEN_SECRET'])
    if checkLatLng(latlng):
        try:
            response = yelp_api.search_query(term=name, ll=latlng, sort=2, limit=20)
        except YelpAPI.YelpAPIError, e:
            app.logger.warning(e + ' ' + latlng + ' ' + name)
    else:
        try:
            response = yelp_api.search_query(term=name, location=city,sort=2, limit=20)
        except YelpAPI.YelpAPIError, e:
            app.logger.warning(e + ' ' + city + ' ' + name)
    try:
        response = [ {'url': d['url'], 'name': d['name']} for d in response['businesses'] ]
    except:
        response = {}


    return json.dumps(response)


####### FOURSQUARE

@mod_extapi.route('/fsqrsrch', methods=[ 'POST'])
@cache.cached(timeout=caching_time, key_prefix=cache_key)
@log_errors
def fsqrsearch():
    client = Foursquare(app.config['FOURSQUARE_KEY'], app.config['FOURSQUARE_SECRET'])
    if 'venueid' in request.form: # Getting foursqr image
        response = client.venues.photos(request.form['venueid'],{})
        if response['photos']['count'] > 0:
            photo = response['photos']['items'][0]
            response = {'url': photo['prefix'] + '200x200' + photo['suffix']}
        else:
            response = {}
        return json.dumps(response)

    latlng = request.form['latlng'];
    name   = request.form['name'];
    city   = request.form['city'];

    if checkLatLng(latlng):
        response = client.venues.search(params={'query': name, 'll': latlng})
    else:
        response = client.venues.search(params={'query': name, 'near': city})
    response = [ {'name':d['name'], 'id':d['id']} for d in response['venues'] ]

    return json.dumps(response)



###### CATEGORY_LIST
@mod_extapi.route('/categorylist', methods=[ 'POST'])
@cache.cached(timeout=3600, key_prefix=cache_key)
@log_errors
def categorylst():
    print "from function"
    print request.form
    category = request.form['category']
    list = ''
    if category in CATEGORY_LIST:
        list = CATEGORY_LIST[category]
    return json.dumps(list)
