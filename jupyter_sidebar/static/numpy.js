/* jshint esnext: true, expr: true, sub: true, laxbreak: true */
/* eslint-env es6 */
/* global define */

define(['nbextensions/jupyter_sidebar/sidebar'], sidebar => {
  /**
   * Numpy Variable Inspector widget
   * @class NumpyTable
   * @param {object}          options - Dictionary of keyword arguments.
   * @param {object}          options.notebook
   * @param {int}             options.nColumn
   */
  const Table = sidebar.Table;

  function NumpyTable({ notebook }) {
    Table.call(this, {
      notebook: notebook,
      header: 'Numpy Variables Inspector',
      nColumn: 4
    });

    this.update.call(this, {
      onRender: ([module, name, type, shape, addr]) => [
        (module === '__main__' ? '' : `<span class=jsb_module>${module}.</span>`) + name,
        `<span class='jsb_type ${NumpyTable._get_type_class(type)}'>${type}</span>`,
        shape.join('\u2009<span class=jsb_multi>\u00d7</span>\u2009'),
        '<span class=jsb_addr_prefix>0x</span>\u200a' + (+addr).toString(16).padStart(16, '0')
      ],
      onSort: [
        ([module, name, type, shape, addr]) => [
          module === '__main__' ? 0 : 1,
          module,
          name.match(/^_/) ? (name.match(/^_\d/) ? 2 : 1) : 0,
          name
        ],
        ([module, name, type, shape, addr]) => type,
        ([module, name, type, shape, addr]) => shape.reduce((sum, dim) => sum * dim, -1),
        ([module, name, type, shape, addr]) => addr
      ],
      sortIndex: 0
    });

    this.callback = () => {
      if (this.config.get('collapsed')) return;
      this.update_from_kernel();
    };
    NumpyTable.prototype.bind_events.call(this);
  }

  NumpyTable.prototype = Object.create(Table.prototype);
  NumpyTable.prototype.constructor = NumpyTable;

  NumpyTable._get_type_class = type =>
    'jsb_' +
    {
      '?': 'bool',
      e: 'float',
      d: 'float',
      f: 'float',
      g: 'float',
      D: 'complex',
      F: 'complex',
      G: 'complex',
      B: 'uint',
      H: 'uint',
      I: 'uint',
      L: 'uint',
      M: 'uint',
      Q: 'uint',
      b: 'int',
      h: 'int',
      i: 'int',
      l: 'int',
      m: 'int',
      q: 'int',
      S: 'string',
      U: 'string',
      O: 'other',
      V: 'other'
    }[type];

  NumpyTable.prototype._shell_reply_handler = function(text) {
    const data = JSON.parse(text);
    this.update.call(this, { data: data });
    this.update_info.call(this, data.length === 0 ? 'No Numpy variable' : '');
  };

  NumpyTable.prototype.update_from_kernel = function() {
    const command = `
from jupyter_sidebar.numpy import report as _jsb_numpy_report
_jsb_numpy_report()`;
    sidebar
      .call_kernel({ notebook: this.notebook, command: command })
      .then(NumpyTable.prototype._shell_reply_handler.bind(this));
  };

  // @final
  NumpyTable.prototype.bind_events = function() {
    this.notebook.events.on('kernel_ready.Kernel', this.callback);
    this.notebook.events.on('finished_execute.CodeCell', this.callback);
    if (this.notebook.kernel !== null) this.callback();
  };

  // @final
  NumpyTable.prototype.unbind_events = function() {
    this.notebook.events.off('kernel_ready.Kernel', this.callback);
    this.notebook.events.off('finished_execute.CodeCell', this.callback);
  };

  NumpyTable.prototype.expand = function() {
    sidebar.Widget.prototype.expand.call(this);
    this.callback();
  };

  NumpyTable.prototype.remove = function() {
    NumpyTable.prototype.unbind_events.call(this);
    Table.prototype.remove.call(this);
  };

  return { NumpyTable: NumpyTable };
});
