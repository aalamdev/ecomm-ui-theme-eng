import os

from aalam_common.config import cfg
from aalam_common import utils as zutils
from aalam_common import wsgi
from aalam_common import CALLBACK_ROUTES, STATE_VALIDATION


class TempengAppHandler(wsgi.BaseHandler):
    def __init__(self, mapper):
        super(TempengAppHandler, self).__init__(mapper)

    def temp_eng(self, request):
        request.static_file = {"resource": "index.html",
                               "path": os.path.join(cfg.CONF.package_dir,
                                                    "resources",
                                                    "index.html")}

    @zutils.mustachify(os.path.join(cfg.CONF.statics_dir, "dist",
                                    "index.html"))
    def send_public_page(self, request, path_info):
        return {'social_link_exists': True,
                'analytics_ga': None,
                'mobile': '1234567890',
                'bizcode': 'SDK',
                'show_footer': True,
                'base_href': '/aalam/tempeng/',
                'social_links': [{
                    'link': 'https://pinterest.com/',
                    'name': 'pinterest'
                 }, {
                    'link': u'https://www.instagram.com/',
                    'name': u'instagram'
                 }, {
                     'link': u'https://facebook.com/',
                     'name': u'facebook'
                 }],
                 'metadata': ''}


def routes_cb(mapper):
    with mapper.submapper(handler=TempengAppHandler(mapper)) as m:
        m.connect("/aalam/tempeng/{path_info:.*}",
                  action="send_public_page",
                  conditions={"method": ["GET"]},
                  serializer="_html_serializer")


def entry(state):
    if state != STATE_VALIDATION:
        pass

    return {CALLBACK_ROUTES: routes_cb}
