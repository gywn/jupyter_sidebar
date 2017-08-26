/* jshint esnext: true, expr: true, sub: true */
/* eslint-env es6 */
/* global define */

define(
  [
    'jquery',
    'base/js/namespace',
    'base/js/events',
    'nbextensions/jupyter_sidebar/sidebar',
    'nbextensions/jupyter_sidebar/numpy'
  ],
  ($, env, events, sidebarmod, sidebar_numpy) => {
    const right_sidebar = new sidebarmod.Sidebar({
      id: 'right-sidebar', // mandatory; can be arbitrary
      position: 'right' // optional; 'left'|'right', default:'right'
    });

    const np_table = new sidebar_numpy.NumpyTable({
      notebook: env.notebook,
      events: events
    });

    right_sidebar.add_widget(np_table);

    const command = `
def __jsb_msg():
  from jupyter_core.paths import jupyter_data_dir, jupyter_path
  import os
  for dir in [jupyter_data_dir()] + jupyter_path():
      path = os.path.join(dir, 'nbextensions/jupyter_sidebar/default.js')
      if (os.path.isfile(path)):
          print("""You can turn off this message in default.js located at:

    {0}

or disable the default setting by running:

    jupyter nbextension disable jupyter_sidebar/default

and write your own setting.""".format(path))
          break
__jsb_msg()`,
      msg = new sidebarmod.CommandOutput({
        header: 'Message',
        notebook: env.notebook,
        events: events,
        command: command
      });

    right_sidebar.add_widget(msg);

    // Uncomment this line to turn off the message
    // msg.remove();

    // Uncomment this line to display left sidebar
    // const left_sidebar = new sidebarmod.Sidebar({ id: 'left-sidebar', position: 'left' });
  }
);
