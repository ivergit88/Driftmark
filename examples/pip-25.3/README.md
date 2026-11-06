# Rehearse with a real release

This sample pairs a constructed team guide with a paraphrase of pip’s actual 25.3 release notes. The guide represents instructions a team could carry forward from an older release. It is a demo input written for Driftmark.

1. Copy `quickstart.md` into Current documentation and `release-notes.md` into New release notes.
2. Select two available open-weight models for different roles. Run the review and inspect the returned evidence for each edit.
3. Look for three supported line pairs, `3:3`, `4:4` and `5:5`. The final command on line 6 should remain untouched. For editable installs, a correction should preserve the distinction between setuptools and other build backends.
4. Select one correction, run the sandbox check and export the revised Markdown. Compare it to the original guide and open the run receipt.

The technical claims in the sample come from the pip changelog and its linked removal discussions. [pip 25.3 changelog](https://pip.pypa.io/en/stable/news/#v25-3) · [Legacy wheel build removal](https://github.com/pypa/pip/issues/6334) · [Legacy editable install removal](https://github.com/pypa/pip/issues/11457)
