import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.wsgi import WSGIContainer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, RequestHandler, Application
from app import app

class MainHandler(RequestHandler):
  def get(self):
    self.write("This message comes from Tornado ^_^")


app.threaded = True
app.debug = False
tr = WSGIContainer(app)


application = Application([
(r"/tornado", MainHandler),
(r"/", FallbackHandler, dict(fallback=tr)),
])



if __name__ == "__main__":
    # application.listen(8000)
    # IOLoop.instance().start()
    http_server = tornado.httpserver.HTTPServer(
            application
            , ssl_options={
        "certfile": "localhost.crt",
        "keyfile": "localhost.key",
    })

http_server.listen(8000)
tornado.ioloop.IOLoop.instance().start()

