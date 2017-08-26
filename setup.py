#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from setuptools import setup

setup(
    name='jupyter_sidebar',
    version='0.1.0',
    description='Sidebar extension for Jupyter',
    packages=['jupyter_sidebar'],
    package_data={
        'jupyter_sidebar': ['static/*']
    }
)
