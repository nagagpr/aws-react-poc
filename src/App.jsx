import './App.css'

const APP_TITLE = 'AWS React Deployment POC'
const APP_SUBTITLE =
  'Same React application deployed using AWS Amplify and AWS Container'

const applicationInfo = [
  { label: 'Application', value: 'React + Vite' },
  { label: 'Environment', value: 'AWS POC' },
  { label: 'Status', value: 'Running', isStatus: true },
]

const deploymentOptions = [
  {
    id: 'amplify',
    name: 'AWS Amplify',
    purpose: 'Frontend Hosting',
    flow: ['GitHub', 'Amplify Build', 'Amplify Hosting'],
    status: 'Ready for Deployment',
  },
  {
    id: 'container',
    name: 'AWS Container',
    purpose: 'Container Deployment',
    flow: {
      steps: ['React App', 'Docker Build', 'Docker Image', 'Amazon ECR'],
      managedService: {
        name: 'ECS Express Mode',
        steps: [
          'ECS Service',
          'Fargate',
          'Application Load Balancer',
          'HTTPS',
          'Auto Scaling + CloudWatch',
        ],
      },
      output: 'AWS HTTPS URL',
    },
    status: 'Ready for Deployment',
  },
]

const comparisonRows = [
  { feature: 'React Hosting', amplify: 'Yes', container: 'Yes' },
  { feature: 'Docker', amplify: 'No', container: 'Yes' },
  { feature: 'Amazon ECR', amplify: 'No', container: 'Yes' },
  { feature: 'ECS Express Mode', amplify: 'No', container: 'Yes' },
  { feature: 'Git-based Deployment', amplify: 'Yes', container: 'Optional' },
  { feature: 'Infrastructure Control', amplify: 'Lower', container: 'Higher' },
  {
    feature: 'Main Purpose',
    amplify: 'Frontend Hosting',
    container: 'Container Deployment',
  },
]

function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <h1 className="header__title">{APP_TITLE}</h1>
        <p className="header__subtitle">{APP_SUBTITLE}</p>
      </div>
    </header>
  )
}

function ApplicationInfo() {
  return (
    <section className="section" aria-labelledby="app-info-heading">
      <h2 id="app-info-heading" className="section__title">
        Application Information
      </h2>
      <div className="info-grid">
        {applicationInfo.map((item) => (
          <div key={item.label} className="info-card">
            <span className="info-card__label">{item.label}</span>
            <span className="info-card__value">
              {item.isStatus && (
                <span className="status-dot" aria-hidden="true" />
              )}
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function DeploymentFlow({ flow }) {
  const steps = Array.isArray(flow) ? flow : flow.steps

  return (
    <ol className="flow">
      {steps.map((step, index) => (
        <li key={step} className="flow__step">
          <span className="flow__node">{step}</span>
          {index < steps.length - 1 && (
            <span className="flow__arrow" aria-hidden="true">
              &darr;
            </span>
          )}
        </li>
      ))}
      {!Array.isArray(flow) && (
        <li className="flow__step flow__step--managed">
          <span className="flow__arrow" aria-hidden="true">
            &darr;
          </span>
          <div className="flow__managed">
            <strong className="flow__managed-title">
              {flow.managedService.name}
            </strong>
            <span className="flow__managed-label">
              AWS creates automatically
            </span>
            <ol className="flow flow--managed">
              {flow.managedService.steps.map((step, index) => (
                <li key={step} className="flow__step">
                  <span className="flow__node">{step}</span>
                  {index < flow.managedService.steps.length - 1 && (
                    <span className="flow__arrow" aria-hidden="true">
                      &darr;
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
          <span className="flow__arrow" aria-hidden="true">
            &darr;
          </span>
          <span className="flow__node flow__node--output">{flow.output}</span>
        </li>
      )}
    </ol>
  )
}

function DeploymentCard({ option }) {
  return (
    <article className="card">
      <div className="card__header">
        <h3 className="card__title">{option.name}</h3>
        <p className="card__purpose">{option.purpose}</p>
      </div>
      <DeploymentFlow flow={option.flow} />
      <div className="card__footer">
        <span className="card__footer-label">Status</span>
        <span className="badge badge--ready">{option.status}</span>
      </div>
    </article>
  )
}

function DeploymentOptions() {
  return (
    <section className="section" aria-labelledby="deploy-options-heading">
      <h2 id="deploy-options-heading" className="section__title">
        Deployment Options
      </h2>
      <div className="card-grid">
        {deploymentOptions.map((option) => (
          <DeploymentCard key={option.id} option={option} />
        ))}
      </div>
    </section>
  )
}

const PILL_TONES = { Yes: 'yes', No: 'no', Optional: 'optional' }

function ValueCell({ value }) {
  const tone = PILL_TONES[value]
  return tone ? <span className={`pill pill--${tone}`}>{value}</span> : value
}

function DeploymentComparison() {
  return (
    <section className="section" aria-labelledby="comparison-heading">
      <h2 id="comparison-heading" className="section__title">
        Deployment Comparison
      </h2>
      <div className="table-wrapper">
        <table className="comparison">
          <thead>
            <tr>
              <th scope="col">Feature</th>
              <th scope="col">Amplify</th>
              <th scope="col">Container</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.feature}>
                <th scope="row">{row.feature}</th>
                <td>
                  <ValueCell value={row.amplify} />
                </td>
                <td>
                  <ValueCell value={row.container} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span className="footer__title">{APP_TITLE}</span>
        <span className="footer__tech">React + Vite</span>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="container main">
        <ApplicationInfo />
        <DeploymentOptions />
        <DeploymentComparison />
      </main>
      <Footer />
    </div>
  )
}
