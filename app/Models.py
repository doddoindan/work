from app import db
from sqlalchemy.ext.declarative import declarative_base
from flask_login import UserMixin
from facebook import GraphAPI
#from flask.ext.sqlalchemt.declarative import declarative_base
Base = declarative_base()
Base.metadata.reflect(db.engine)

import flask.ext.restless

class User(UserMixin, db.Model):
    __tablename__ = Base.metadata.tables['facebook_app_user']
    __table__ = Base.metadata.tables['facebook_app_user']


    def checkPermission(self, original_id):
        return original_id in self.accounts.split(',')



    def get_id(self):
        try:
            return unicode(self.id)  # python 2
        except NameError:
            return str(self.id)  # python 3

class Fanpage(db.Model):

    __table__ = Base.metadata.tables['facebook_app_dump']
    __tablename__ = Base.metadata.tables['facebook_app_dump']



