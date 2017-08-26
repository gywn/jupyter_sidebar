/* jshint esnext: true, expr: true, sub: true, laxbreak: true */
/* eslint-env es6 */
/* global define */

define(
  [
    'require',
    'jquery',
    'base/js/namespace',
    'base/js/utils',
    'nbextensions/jupyter_sidebar/resized-by'
  ],
  (require, $, _, utils) => {
    /**
     * Contains sidebar widgets
     * @class Sidebar 
     * @param {string}          selector - for parent
     * @param {object}          options - Dictionary of keyword arguments.  
     * @param {object}          options.notebook
     * @param {string}          options.position - left|right
     * @param {float}           options.widgetAnimationDuration
     */
    const sidebars = new Map(),
      widgets = new Map();

    function Sidebar({ id, notebook = _.notebook, position }) {
      if (sidebars.has(id)) throw `Sidebar ${id} is already loaded.`;
      this.id = id;
      this.notebook = notebook;
      this.position = position;
      this.parent = $('div#ipython-main-app');
      Sidebar.prototype.create_element.call(this);
      sidebars.set(this.id, this);
    }

    Sidebar.options_default = { width: 300, position: 'right' };

    Sidebar.prototype.create_element = function() {
      const all_config = this.notebook.config.data.Sidebar,
        config = $.extend(
          true,
          Sidebar.options_default,
          all_config && all_config[this.id],
          { position: this.position }
        );
      this.position = config.position;

      $('head').append(
        $('<link/>', {
          type: 'text/css',
          rel: 'stylesheet',
          href: require.toUrl('./sidebar.css')
        })
      );
      this.resizer = $('<div/>', { class: 'resizer panel_resizer' });
      this.element = $('<div/>', { class: 'sidebar_panel' })
        .data('model', this)
        .resizedBy({
          handleSelector: this.resizer,
          resizeWidthFrom: this.position === 'left' ? 'right' : 'left',
          resizeHeight: false,
          onDragEnd: () =>
            this.notebook.config.update({
              Sidebar: { [this.id]: { width: this.element.width() } }
            }),
          enable: () => !this.element.hasClass('collapsed')
        })
        .sortable({
          connectWith: '.sidebar_panel',
          items: '> .sidebar_widget',
          handle: '.sidebar_header',
          forcePlaceholderSize: true,
          tolerance: 'pointer',
          change: () => {
            $('.sidebar_panel').each((i, s) => $(s).data('model').expand().collapse());
          }
        });
      this.handler = $('<div/>', { class: 'sidebar_handler' });
      this.element.append(this.handler);
      if (this.position === 'left') {
        this.parent.prepend([this.element, this.resizer]);
      } else {
        this.parent.append([this.resizer, this.element]);
      }

      this.element.width(config.width);
      Sidebar.prototype.collapse.call(this);

      // Menu item
      // const toggle_sidebar_handle = () => $('.sidebar_panel, .resizer_panel').toggle(),
      //   toggle_sidebar = $(`
      // <li id="toggle_sidebar" title="Show/Hide sidebar">
      // <a href="#">Toggle Sidebar</a>
      // </li>`)
      //     .click(toggle_sidebar_handle)
      //     .appendTo($('#view_menu'));
      // _.actions.register(
      //   { handler: toggle_sidebar_handle },
      //   'toggle-sidebar',
      //   'notebook-sidebar'
      // );
    };

    Sidebar.prototype.expand = function() {
      if (!this.element.hasClass('collapsed')) return this;
      this.element.removeClass('collapsed');
      const el = this.element;
      el.width(el.data('old_width'));
      el.find('> .sidebar_widget').show();
      return this;
    };

    Sidebar.prototype.collapse = function() {
      if (
        this.element.hasClass('collapsed') ||
        this.element.find(
          '> .sidebar_widget:not(.ui-sortable-helper), > .sidebar_widget_placeholder'
        ).length > 0
      )
        return this;
      this.element.addClass('collapsed');
      const el = this.element;
      el.data('old_width', el.width());
      el.width(10);
      el.find('> .sidebar_widget:not(.ui-sortable-helper)').hide();
      return this;
    };

    Sidebar.prototype.add_widget = function(widget) {
      if (widgets.has(widget.id)) throw `Widget ${widget.id} is already loaded.`;
      widgets.set(widget.id, widget);
      widget.sidebar = this;
      this.element.append(widget.element);
      Sidebar.prototype.expand.call(this);
      return this;
    };

    function Widget({ header }) {
      this.sidebar = null;
      this.id = utils.uuid();
      Widget.prototype.create_element.call(this);
      Widget.prototype.update_header.call(this, header);
    }

    Widget.prototype.create_element = function() {
      this.element = $('<div/>', { class: 'sidebar_widget' }).data('model', this);
      const button = $('<div/>', { class: 'fa fa-times sidebar_tr_button' })
        .css('color', '#aaa')
        .click(() => this.remove());
      this.header = $('<div/>', { class: 'sidebar_header sidebar_text' }).click(() => {
        this.element.toggleClass('collapsed');
      });
      this.body = $('<div/>', { class: 'sidebar_body' });
      this.element.append([this.header, this.body, button]);
    };

    Widget.prototype.update_header = function(html) {
      this.header.html(html);
      return this;
    };

    Widget.prototype.detach = function() {
      if (widgets.has(this.id)) widgets.delete(this.id);
      this.element.detach();
      if (this.sidebar) {
        this.sidebar.collapse();
        this.sidebar = null;
      }
      return this;
    };

    Widget.prototype.remove = function() {
      Widget.prototype.detach.call(this).element.remove();
    };

    /**
     * Table widget
     * @class Table 
     * @param {object}          options - Dictionary of keyword arguments.  
     * @param {string}          options.header
     * @param {int}             options.nColumn
     * @param {string}          options.info
     */
    function Table(options) {
      Widget.call(this, options);
      this.data = [];
      this.onRender = d => d;
      this.onSort = null;
      this.sortIndex = 0;
      this.ascendant = true;

      Table.prototype.create_element.call(this, options);
      Table.prototype.update_info.call(this, options.info);
    }

    Table.prototype = Object.create(Widget.prototype);
    Table.prototype.constructor = Table;

    Table.prototype.create_element = function({ nColumn }) {
      const tbody = $('<div/>', { class: 'sidebar_table_body' });
      this.info = $('<div/>', { class: 'sidebar_table_info sidebar_text' });
      this.body.append([tbody, this.info]);
      this.columns = [];
      for (var i = 0; i < nColumn; i++) {
        const col = $('<div/>', { class: 'sidebar_table_column' }).data('index', i);
        tbody.append(col);
        this.columns.push(col);
        if (i !== nColumn - 1) {
          const resizer = $('<div/>', { class: 'resizer' });
          col.resizedBy({ handleSelector: resizer, resizeHeight: false });
          tbody.append(resizer);
        }
      }
      const that = this;
      tbody.find('> .sidebar_table_column').click(function() {
        that.update({ sortIndex: $(this).data('index') });
      });
    };

    Table._get_compare_func = func => {
      return func.length < 2
        ? (x, y) => {
            const ix = func(x),
              iy = func(y);
            return ix < iy ? -1 : ix > iy ? 1 : 0;
          }
        : func;
    };

    /**
     * Update content of table
     * @class Table 
     * @param {object}          options - Dictionary of keyword arguments.  
     * @param {Array}           options.data
     * @param {function}        options.onRender
     * @param {Array}           options.onSort - contains compareFunctions or 
     *                          indexFunctions
     * @param {int}             options.sortIndex
     */
    Table.prototype.update = function({ data, onRender, onSort, sortIndex }) {
      this.ascendant =
        !data && !onSort && sortIndex === this.sortIndex ? !this.ascendant : true;
      $.extend(this, { data: data, onRender: onRender, onSort: onSort, sortIndex: sortIndex });
      this.data.sort(this.onSort && Table._get_compare_func(this.onSort[this.sortIndex]));

      this.columns.forEach(c => c.empty());
      this.data.forEach(d =>
        this.onRender(d).forEach((c, i) => {
          if (i < this.columns.length) {
            const cell = $('<div/>', { html: c, class: 'sidebar_table_cell sidebar_text' });
            if (this.ascendant) {
              this.columns[i].append(cell);
            } else {
              this.columns[i].prepend(cell);
            }
          }
        })
      );
      return this;
    };

    Table.prototype.update_info = function(info) {
      if (info) {
        this.info.html(info).show();
      } else {
        this.info.html('').hide();
      }
      return this;
    };

    /**
     * CommandOutput widget
     * @class CommandOutput 
     * @param {object}          options - Dictionary of keyword arguments.  
     * @param {string}          options.header
     * @param {object}          options.notebook
     * @param {object}          options.events 
     * @param {string}          options.command
     */
    function CommandOutput(options) {
      Widget.call(this, options);
      this.notebook = options.notebook;
      this.events = options.events;
      this.command = options.command;

      CommandOutput.prototype.create_element.call(this);

      this.callback = () => {
        if (this.element.hasClass('collapsed')) return;
        call_kernel({ notebook: this.notebook, command: this.command }).then(text =>
          this.output.text(text)
        );
      };
      CommandOutput.prototype.bind_events.call(this);
    }

    CommandOutput.prototype = Object.create(Widget.prototype);
    CommandOutput.prototype.constructor = CommandOutput;

    CommandOutput.prototype.create_element = function() {
      this.output = $('<div/>', { class: 'sidebar_line sidebar_text' });
      this.output.css({ 'white-space': 'pre-wrap', 'word-break': 'break-all' });
      this.body.append(this.output);
    };

    CommandOutput.prototype.bind_events = function() {
      this.events.on('kernel_ready.Kernel', this.callback);
      this.events.on('finished_execute.CodeCell', this.callback);
      if (this.notebook.kernel !== null) this.callback();
    };

    CommandOutput.prototype.unbind_events = function() {
      this.events.off('kernel_ready.Kernel', this.callback);
      this.events.off('finished_execute.CodeCell', this.callback);
    };

    CommandOutput.prototype.remove = function() {
      CommandOutput.prototype.unbind_events.call(this);
      Widget.prototype.remove.call(this);
    };

    /**
     * Helper function to execute script
     */
    const call_kernel = ({ notebook, command }) =>
      new Promise((rsl, rjt) => {
        var stdout = '',
          stderr = '';
        const msg_id = notebook.kernel.execute(command, {
          iopub: {
            output: r => {
              if (r.parent_header.msg_id !== msg_id) return;
              if (r.msg_type === 'stream') stdout += r.content.text;
              else rjt(r);
            }
          },
          shell: {
            reply: r => {
              if (r.parent_header.msg_id !== msg_id) return;
              if (r.content.status === 'ok') rsl(stdout);
              else rjt(r);
            }
          }
        });
      });

    return {
      Sidebar: Sidebar,
      Widget: Widget,
      Table: Table,
      CommandOutput: CommandOutput,
      call_kernel: call_kernel
    };
  }
);
