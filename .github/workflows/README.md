# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the MindMeter project.

## Workflows Overview

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Purpose:** Continuous Integration and testing for all code changes.

**Triggers:**

- Push to `master` or `develop` branches
- Pull requests to `master` or `develop` branches

**What it does:**

- Runs ESLint and Prettier on frontend code
- Executes frontend tests with coverage
- Builds frontend application
- Compiles and tests backend code
- Runs SpotBugs, Checkstyle, and OWASP checks on backend
- Packages backend JAR file
- Performs security scanning on master branch
- Uploads build artifacts

**Duration:** ~10-15 minutes

### 2. Production Deployment (`deploy-production.yml`)

**Purpose:** Deploy application to production environment.

**Triggers:**

- Push to `master` branch
- Version tags (v\*)
- Manual workflow dispatch

**What it does:**

- Builds production-ready frontend
- Packages production backend JAR
- Creates GitHub releases for version tags
- Generates deployment artifacts
- Provides deployment summary

**Duration:** ~8-12 minutes

### 3. Code Quality Checks (`code-quality.yml`)

**Purpose:** Comprehensive code quality and security analysis.

**Triggers:**

- Pull requests to `master` or `develop` branches
- Weekly schedule (Sunday at midnight)
- Manual workflow dispatch

**What it does:**

- Runs detailed ESLint and Prettier checks
- Analyzes code complexity
- Runs Checkstyle, SpotBugs, and PMD on backend
- Performs npm audit and OWASP dependency checks
- Generates code coverage reports
- Creates quality gate summary

**Duration:** ~15-20 minutes

## Workflow Status Badges

Add these badges to your README.md to display workflow status:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/MindMeter/actions/workflows/ci-cd.yml/badge.svg)
![Production Deployment](https://github.com/YOUR_USERNAME/MindMeter/actions/workflows/deploy-production.yml/badge.svg)
![Code Quality](https://github.com/YOUR_USERNAME/MindMeter/actions/workflows/code-quality.yml/badge.svg)
```

## Quick Start

### Running Workflows Manually

1. Go to the **Actions** tab in your GitHub repository
2. Select the workflow you want to run
3. Click **Run workflow** button
4. Select the branch
5. Click **Run workflow**

### Viewing Workflow Results

1. Go to the **Actions** tab
2. Click on a workflow run to see details
3. Click on individual jobs to see logs
4. Download artifacts from the workflow summary page

## Artifacts

Workflows generate the following artifacts:

### CI/CD Pipeline

- `frontend-build` - Built React application (30 days retention)
- `eslint-report` - ESLint analysis results (30 days retention)
- `backend-jar` - Spring Boot JAR file (30 days retention)
- `backend-test-reports` - JUnit test reports (30 days retention)

### Production Deployment

- `frontend-production-build` - Production-ready frontend (90 days retention)
- `backend-production-jar` - Production-ready backend (90 days retention)

### Code Quality Checks

- `frontend-eslint-report` - Detailed ESLint report (30 days retention)
- `backend-quality-reports` - Checkstyle, SpotBugs, PMD reports (30 days retention)
- `security-audit-reports` - Security vulnerability reports (30 days retention)
- `frontend-coverage` - Frontend test coverage (30 days retention)
- `backend-coverage` - Backend test coverage (30 days retention)

## Configuration

### Required Secrets

See `.github/SECRETS.md` for detailed configuration instructions.

Essential secrets:

- Database credentials
- JWT secret
- OAuth credentials
- Payment gateway credentials
- AI service API keys

### Required Variables

- `REACT_APP_API_URL` - Backend API URL for production

### Environment Setup

- Node.js 18
- Java 11
- Maven 3.6+
- npm 9+

## Troubleshooting

### Common Issues

#### Build Failures

**Problem:** Workflow fails during build step
**Solution:**

- Check if all dependencies are correctly specified
- Verify environment variables are set
- Review build logs for specific error messages

#### Test Failures

**Problem:** Tests fail in CI but pass locally
**Solution:**

- Ensure database is properly configured
- Check for environment-specific code
- Verify test data is consistent

#### Artifact Upload Issues

**Problem:** Artifacts fail to upload
**Solution:**

- Check artifact path is correct
- Ensure build step completed successfully
- Verify artifact size is within limits (2GB per file)

#### Security Scan Failures

**Problem:** Security vulnerabilities detected
**Solution:**

- Review vulnerability report
- Update vulnerable dependencies
- Add exceptions for false positives if necessary

### Workflow Not Triggering

1. Check if branch name matches trigger conditions
2. Verify workflow file syntax is correct
3. Ensure workflow is enabled in repository settings
4. Check if repository has Actions enabled

### Debugging Workflows

Enable debug logging:

1. Go to repository Settings → Secrets and variables → Actions
2. Add secret: `ACTIONS_STEP_DEBUG` with value `true`
3. Add secret: `ACTIONS_RUNNER_DEBUG` with value `true`
4. Re-run the workflow

## Best Practices

### For Developers

1. **Always create pull requests** for code changes
2. **Wait for CI checks to pass** before merging
3. **Review workflow logs** if builds fail
4. **Fix failing tests immediately** - don't ignore them
5. **Keep dependencies updated** to avoid security issues

### For Maintainers

1. **Monitor workflow runs** regularly
2. **Review and rotate secrets** quarterly
3. **Update workflow configurations** as needed
4. **Archive old artifacts** to save storage
5. **Keep workflows simple** and maintainable

## Workflow Optimization

### Reducing Build Times

- Use dependency caching (already configured)
- Run jobs in parallel when possible
- Skip unnecessary steps with conditional execution
- Optimize test suites

### Cost Optimization

- Use self-hosted runners for private repositories (optional)
- Clean up old artifacts regularly
- Use scheduled workflows sparingly
- Optimize workflow triggers

## Security

### Workflow Security Best Practices

1. **Never log secrets** in workflow outputs
2. **Use minimal permissions** for GITHUB_TOKEN
3. **Pin action versions** to specific commits or tags
4. **Review third-party actions** before use
5. **Enable branch protection** for master branch

### Handling Secrets

- Store all sensitive data in GitHub Secrets
- Never hardcode credentials
- Use environment-specific secrets
- Rotate secrets regularly
- Audit secret usage

## Maintenance

### Regular Tasks

- **Weekly:** Review failed workflows
- **Monthly:** Update dependencies in workflows
- **Quarterly:** Review and update workflow logic
- **Yearly:** Audit all workflows and secrets

### Updating Workflows

1. Create a new branch for workflow changes
2. Test changes thoroughly
3. Create pull request with clear description
4. Monitor first few runs after merge
5. Document any breaking changes

## Support

### Getting Help

1. Check this documentation first
2. Review workflow logs for error messages
3. Search GitHub Actions documentation
4. Check project issues for similar problems
5. Contact the development team

### Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Actions Community Forum](https://github.community/c/actions/41)

## Contributing

When adding or modifying workflows:

1. Follow existing patterns and conventions
2. Add clear comments for complex logic
3. Test thoroughly before merging
4. Update this documentation
5. Consider backward compatibility

## License

These workflows are part of the MindMeter project and follow the same license.
