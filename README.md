Jupyter sidebar extension
===========================

[![GitHub tag](https://img.shields.io/github/tag/gywn/jupyter_sidebar.svg?maxAge=3600&label=Github)](https://github.com/gywn/jupyter_sidebar) [![PyPI](https://img.shields.io/pypi/v/jupyter_sidebar.svg?maxAge=3600)](https://pypi.python.org/pypi/jupyter_sidebar)

This extension adds sidebars to Jupyter notebook and provides functionalities to write sidebar widgets.

There are two builtin sidebar widgets:

| Name            | Description                              |
| --------------- | ---------------------------------------- |
| `NumpyTable`    | Monitors Numpy `ndarray` variables, similar to MATLAB's Variable Inspector. Activated by default. |
| `CommandOutput` | Periodically runs a piece of Python code and displays its output on the sidebar. |

Installation
============

Three steps are required to install this Jupyter extension:

1\. Install the Python package:
    pip install jupyter_sidebar
2\. Register the extension in Jupyter:
    jupyter nbextension install --py jupyter_sidebar
3\. Enable the extension:
    jupyter nbextension enable --py jupyter_sidebar

Supported Environment
===============================

Only tested in the following environment:

- Python 3.6.1
- IPython 6.1.0
- Jupyter 4.3.0
- Google Chrome 60

Acknowledgments
=======
Some early codes were sourced from the following projects:
- [Jupyter Interactive Notebook](https://github.com/jupyter/notebook)
- [jupyter_contrib_nbextensions/varInspector](https://github.com/ipython-contrib/jupyter_contrib_nbextensions/tree/master/src/jupyter_contrib_nbextensions/nbextensions/varInspector) by [Jean-François Bercher](https://github.com/jfbercher)
- [jquery-resizable](https://github.com/RickStrahl/jquery-resizable) by [Rick Strahl](https://github.com/RickStrahl)