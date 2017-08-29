#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from setuptools import setup

setup(
    name='jupyter_sidebar',
    version='0.1',
    description='Sidebar extension for Jupyter',
    packages=['jupyter_sidebar'],
    package_data={
        'jupyter_sidebar': ['static/*']
    },
    url='https://github.com/gywn/jupyter_sidebar',
    download_url='https://github.com/gywn/jupyter_sidebar/archive/0.1.tar.gz'
)
