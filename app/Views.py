from facebook import get_user_from_cookie, GraphAPI
from flask import  render_template,g,session, request,send_from_directory
from flask.ext.login import login_user, login_required, current_user, logout_user
from app import app, db, lm, uploaded_photos
from app.Models import User
import json
from flask.ext.uploads import UploadNotAllowed
from Utils import log_errors


# routs for uploaded files (in future change for nginx)
@log_errors
@app.route('/uploads/<path:dir>/<path:path>')
def send_js(dir,path):
    return send_from_directory('uploads/'+dir, path)

@log_errors
@app.route('/upload', methods=[ 'POST'])
def new():
    error = ''
    image = ''
    if request.method == 'POST':
        print request
        photo = request.files.get('photo')
        if not photo:
            error = "photo not found"
        else:
            try:
                filename = uploaded_photos.save(photo)

            except UploadNotAllowed:
                error = "The upload was not allowed"
            else:
                image = filename
    return json.dumps({'error': error, 'image': image})


# RENDER APP

@app.route('/', methods=['POST','GET'])
@log_errors
def canvas():
    return render_template('index.html', app_id=app.config['CANVAS_CLIENT_ID'], app_name= "WherePro" )


@app.before_request
@log_errors
def before_request():
    g.user = current_user
    if g.user is not None and g.user.is_authenticated:
        return


    # Attempt to get the short term access token for the current user.
    result = get_user_from_cookie(cookies=request.cookies, app_id=app.config['CANVAS_CLIENT_ID'],
                                  app_secret =app.config['CANVAS_CLIENT_SECRET'])
    if result:

        graph = GraphAPI(result['access_token'])
        profile  = graph.get_object('me')
        facebook_id = profile['id']

        accounts = graph.get_object('me/accounts')['data']
        accounts = ','.join(i['id'] for i in accounts)

        user = User.query.filter_by(facebook_id=facebook_id).first()
        #print user
        if user is None:
            user = User(facebook_id=facebook_id)
        user.accounts = accounts
        db.session.add(user)
        db.session.commit()
        login_user(user, remember = False)

        #print "we are CONNECTED!!!!"

#print "Before Request"


@lm.user_loader
def load_user(id):
    return User.query.get(int(id))




