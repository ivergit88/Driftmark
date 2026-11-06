# Team build guide for pip 25.2

Use `python -m pip install --no-use-pep517 .` to opt out of the modern build interface for a local project.
Use `python -m pip wheel --global-option=--verbose .` to pass a global build option to the backend.
If the build backend lacks editable support, `python -m pip install -e .` can use the legacy `setup.py develop` fallback.
Inspect the installed package version with `python -m pip show my-package`.
