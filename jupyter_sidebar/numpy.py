#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import numpy as np
import jupyter_sidebar


def _ndarray_info(var):
    return [
        var.dtype.char, var.shape,
        var.__array_interface__['data'][0]
    ]


def report():
    data = []
    for m in jupyter_sidebar.MODULES:
        data += [
            (m.__name__, n, *_ndarray_info(getattr(m, n))) for n in dir(m)
            if isinstance(getattr(m, n), np.ndarray)
        ]
    json.dump(data, sys.stdout)
