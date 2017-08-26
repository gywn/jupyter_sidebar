#!/usr/bin/env python3
# -*- coding: utf-8 -*-


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    pass


# def _jupyter_server_extension_paths():
#     return [{
#         'module': 'jupyter_sidebar'
#     }]


def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'jupyter_sidebar',
        'require': 'jupyter_sidebar/default'
    }]
