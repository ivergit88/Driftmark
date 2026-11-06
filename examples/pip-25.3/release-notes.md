# pip 25.3 release changes

pip 25.3 always uses the PEP 517 build interface and removed the `--no-use-pep517` option.
The `--global-option` and `--build-option` flags are gone. Use `--config-setting` to pass backend-specific settings.
pip removed the legacy `setup.py develop` fallback for editable installations. Setuptools 64 or later is required for editable installs using setuptools.
pip added a build constraint option for isolated build dependencies.
