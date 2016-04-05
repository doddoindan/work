#!flask/bin/python
from app import app

context = ('localhost.crt', 'localhost.key')
app.run(debug=False, threaded=True, ssl_context=context, port=8000)