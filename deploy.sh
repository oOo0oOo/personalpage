#!/bin/bash
# Deploy the portfolio to https://oli.show/. The build steps and the target live in ~/Code/infra/apps.toml
# (entry "personalpage"); box checks the repo, builds, publishes a new release and
# rolls back if the site doesn't answer. Usage: $0 [--dry-run] [--force]
exec ~/Code/infra/box deploy personalpage "$@"
