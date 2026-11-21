import os
import sys

# Ensure api directory is on Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from app import create_app

app = create_app()

class VercelPathFixerMiddleware:
    """WSGI middleware ensuring proper URL routing on Vercel Serverless Functions."""
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path_info = environ.get('PATH_INFO', '')

        # When invoked on Vercel, if path_info is the function name, recover original path
        if path_info in ('/api/index', '/api/index.py'):
            forwarded = (
                environ.get('HTTP_X_FORWARDED_PATH') or
                environ.get('HTTP_X_FORWARDED_URI') or
                environ.get('RAW_URI') or
                environ.get('REQUEST_URI', '')
            )
            if forwarded:
                path_info = forwarded.split('?')[0]

        # Ensure path begins with /api for Blueprint matching
        if not path_info.startswith('/api'):
            path_info = '/api' + path_info

        environ['PATH_INFO'] = path_info
        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelPathFixerMiddleware(app.wsgi_app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
