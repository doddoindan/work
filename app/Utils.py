from shutil import copyfile
import hashlib
from os import remove
from os.path import splitext
from flask.ext.restless import ProcessingException
from app import app
from flask import g,request
from functools import wraps
import sys, traceback
import urllib

def cache_key():
    args = request.form
    key  = request.path + '?' + urllib.urlencode([
        (k, v) for k in sorted(args) for v in sorted(args.getlist(k))
    ])
    return key

####################################
### Decorators
####################################

def log_errors(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception:
            exc_type, exc_instance, exc_traceback = sys.exc_info()
            formatted_traceback = ''.join(traceback.format_tb(exc_traceback))
            message = '\n{0}\n{1}:\n{2}'.format(
                                                formatted_traceback,
                                                exc_type.__name__,
                                                exc_instance.message
            )
            app.logger.error(message)
            #app.logger.error(traceback.print_exc())
    return decorator


#####################################
### Preprocessors for Flask-Restless
#####################################
@log_errors
def auth_single(*args, **kwargs):
    instance_id = '-1'
    if 'instance_id' in kwargs:
        instance_id = kwargs['instance_id']
    if ('data' in kwargs) and ('original_id' in kwargs['data']):
        instance_id = kwargs['data']['original_id']
    if not g.user.checkPermission(instance_id):
        raise ProcessingException(description='Access denied', code=405)
@log_errors
def move_temp_files(*args, **kwargs):
    def check_tmp(url):
        if not url:
            return False
        return url.startswith(app.config['UPLOADED_TEMP_FOLDER'])
    def move_temp_file(url):
        def md5_from_file (fileName, block_size=2**14):
            md5 = hashlib.md5()
            f = open(fileName)
            while True:
                data = f.read(block_size)
                if not data:
                    break
                md5.update(data)
            f.close()
            return md5.hexdigest()
        filename, file_extension = splitext(url)
        source = app.config['APP_FOLDER'] + url
        dest   = app.config['UPLOADED_IMAGE_FOLDER'] +'/' +md5_from_file(source) + file_extension
        copyfile(source, app.config['APP_FOLDER'] + dest)
        remove(source)
        return dest

    if ('data' in kwargs):

        url = kwargs['data']['insta_uploaded']
        if check_tmp(url):
            kwargs['data']['insta_uploaded'] = move_temp_file(url)

        url = kwargs['data']['fsqr_uploaded']
        if check_tmp(url):
            kwargs['data']['fsqr_uploaded'] = move_temp_file(url)

        url = kwargs['data']['picture_uploaded']
        if check_tmp(url):
            kwargs['data']['picture_uploaded'] = move_temp_file(url)

        url = kwargs['data']['cover_uploaded']
        if check_tmp(url):
            kwargs['data']['cover_uploaded'] = move_temp_file(url)

# Deny to request all fanpages
def auth_many(*args, **kwargs):
    raise ProcessingException(description='Access denied', code=405)
