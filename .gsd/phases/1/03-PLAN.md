---
phase: 1
plan: 3
wave: 1
depends_on: ["1.1", "1.2"]
files_modified:
  - .github/workflows/test.yml
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Tests run automatically on every push to GitHub"
    - "CI pipeline fails if tests fail"
    - "Coverage report generated in CI"
  artifacts:
    - "GitHub Actions workflow file exists"
    - "Workflow runs on push and pull_request events"
    - "Test results visible in GitHub UI"
---

# Plan 1.3: CI/CD Pipeline Setup

<objective>
Configure GitHub Actions to automatically run tests on every push and pull request, ensuring code quality gates are enforced.

**Purpose:** Prevent broken code from being merged and provide continuous feedback on test status.

**Output:**
- GitHub Actions workflow for testing
- Automated test execution on push/PR
- Test results visible in GitHub UI
- Foundation for future quality gates
</objective>

<context>
Load for context:
- .gsd/phases/1/01-PLAN.md (Jest configuration)
- .gsd/phases/1/02-PLAN.md (example tests)
- .gsd/STACK.md (Node.js 20.x, Next.js 14)
- package.json (test scripts)
</context>

<tasks>

<task type="auto">
  <name>Create GitHub Actions test workflow</name>
  <files>.github/workflows/test.yml</files>
  <action>
    Create .github/workflows/test.yml with the following configuration:
    
    ```yaml
    name: Test
    
    on:
      push:
        branches: [ master, main ]
      pull_request:
        branches: [ master, main ]
    
    jobs:
      test:
        runs-on: ubuntu-latest
        
        strategy:
          matrix:
            node-version: [20.x]
        
        steps:
          - name: Checkout code
            uses: actions/checkout@v4
          
          - name: Setup Node.js ${{ matrix.node-version }}
            uses: actions/setup-node@v4
            with:
              node-version: ${{ matrix.node-version }}
              cache: 'npm'
          
          - name: Install dependencies
            run: npm ci
          
          - name: Run tests
            run: npm test -- --coverage --ci
          
          - name: Upload coverage reports
            uses: codecov/codecov-action@v4
            if: always()
            with:
              token: ${{ secrets.CODECOV_TOKEN }}
              files: ./coverage/coverage-final.json
              flags: unittests
              fail_ci_if_error: false
    ```
    
    Create .github/workflows/ directory if it doesn't exist.
    
    AVOID: Do NOT use outdated action versions (actions/checkout@v2, etc)
    AVOID: Do NOT forget --ci flag for Jest - prevents hanging in CI
  </action>
  <verify>Check .github/workflows/test.yml exists with proper YAML syntax</verify>
  <done>GitHub Actions workflow file exists and is properly formatted</done>
</task>

<task type="auto">
  <name>Configure Jest for CI environment</name>
  <files>jest.config.js</files>
  <action>
    Update jest.config.js to add CI-specific configuration:
    
    Add to customJestConfig object:
    ```javascript
    testTimeout: 10000, // Increase timeout for CI
    maxWorkers: process.env.CI ? 2 : undefined, // Limit workers in CI
    bail: process.env.CI ? 1 : 0, // Fast fail in CI
    ```
    
    This ensures tests run reliably in CI environment with resource constraints.
    
    AVOID: Do NOT use too many workers in CI - causes OOM errors.
  </action>
  <verify>npm test -- --ci runs successfully with updated config</verify>
  <done>Jest configuration optimized for CI environment</done>
</task>

<task type="checkpoint:human-verify">
  <name>Verify GitHub Actions workflow execution</name>
  <files>N/A (CI verification)</files>
  <action>
    This task requires human verification:
    
    1. Commit all Phase 1 changes:
       ```
       git add .
       git commit -m "feat: add testing infrastructure

- Install Jest + React Testing Library
- Configure for Next.js 14 App Router
- Add example unit and integration tests
- Set up GitHub Actions CI pipeline"
       ```
    
    2. Push to GitHub:
       ```
       git push origin [branch-name]
       ```
    
    3. Go to GitHub repository → Actions tab
    
    4. Verify:
       - Workflow "Test" appears in the list
       - Workflow runs automatically
       - All steps complete successfully (green checkmarks)
       - Test results show passing tests
    
    If workflow fails:
    - Check the logs in GitHub Actions
    - Fix any environment-specific issues
    - Re-push to trigger another run
    
    USER INPUT REQUIRED: Confirm tests pass in GitHub Actions.
  </action>
  <verify>GitHub Actions shows green checkmark for test workflow</verify>
  <done>CI pipeline successfully runs tests on every push, workflow verified in GitHub UI</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] .github/workflows/test.yml exists and is valid YAML
- [ ] Workflow triggers on push and pull_request
- [ ] Tests run in Node.js 20.x environment
- [ ] Coverage reports generated
- [ ] Workflow visible and passing in GitHub Actions UI
</verification>

<success_criteria>
- [ ] GitHub Actions workflow created
- [ ] Tests run automatically on push/PR
- [ ] CI pipeline fails if tests fail
- [ ] Workflow execution verified by user
- [ ] Foundation ready for future quality gates (coverage thresholds, lint checks, etc.)
</success_criteria>
