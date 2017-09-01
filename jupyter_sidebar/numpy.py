#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import types
import numpy as np

MODULES = set([sys.modules['__main__']])


def monitor(module):
    if isinstance(module, types.ModuleType):
        MODULES.add(module)
    else:
        raise TypeError('not module type')


def unmonitor(module):
    if module in MODULES:
        MODULES.remove(module)


def _ndarray_info(var):
    return var.dtype.char, var.shape, var.__array_interface__['data'][0]


def report():
    data = []
    for m in MODULES:
        data += [
            (m.__name__, n) + _ndarray_info(getattr(m, n)) for n in dir(m)
            if isinstance(getattr(m, n), np.ndarray)
        ]
    json.dump(data, sys.stdout)
