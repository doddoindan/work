from flask import Flask
from flask_login import LoginManager, current_user
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.cache import Cache

from flask.ext.uploads import (UploadSet, configure_uploads, IMAGES,
                               UploadNotAllowed)
import json
import logging
from logging.handlers import RotatingFileHandler

app = Flask('WherePro')
app.config.from_object('config')

#
cache = Cache(app)

#logging handler
handler = RotatingFileHandler(app.config['LOG_FILE'], maxBytes=1000000, backupCount=1)
formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")
handler.setLevel(logging.INFO)
handler.setFormatter(formatter)
app.logger.addHandler(handler)

db = SQLAlchemy(app)

lm = LoginManager()
lm.init_app(app)


# uploads
uploaded_photos = UploadSet('photos', IMAGES)
configure_uploads(app, uploaded_photos)


##############################
#### RESTful API ############
############################

from flask.ext.restless import ProcessingException, APIManager
from app.Models import Fanpage
from Utils import auth_single,auth_many,move_temp_files





preprocessors = {'GET_SINGLE': [auth_single,move_temp_files],'GET_MANY': [auth_many], 'POST': [auth_single,move_temp_files], 'PATCH_SINGLE':[auth_single,move_temp_files]}
manager = APIManager(app, flask_sqlalchemy_db=db)
fanpage_blueprint = manager.create_api(Fanpage,
                                       preprocessors=preprocessors,
                                       methods=['GET', 'POST', 'PATCH'],
                                       primary_key='original_id')
######################################
############## END RESTful part######
###################################

# load json file with categories
with open('static/json/category_list.json') as data_file:
    CATEGORY_LIST = json.load(data_file)

########################################
### Endpoints for Yelp, Instagram etc
######################################

from mod_extApi.controllers import mod_extapi as extampi_module
app.register_blueprint(extampi_module)


#if __name__ == '__main__':
#    app.run()

from app import Views

app.logger.info("Server is UP!!!")