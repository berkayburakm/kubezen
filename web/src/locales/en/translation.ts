const enTranslation = {
  app: {
    title: 'KubeZen',
    cluster: 'Cluster',
    connected: 'Connected',
    offline: 'Offline',
    access: 'Access',
    newAction: 'New Action',
  },
  common: {
    retry: 'Retry',
    noData: 'No data to display',
  },
  auth: {
    loginTitle: 'Sign in to KubeZen',
    loginDescription: 'Authenticate to access your Kubernetes dashboards.',
    sso: 'Single Sign-On',
    chooseProvider: 'Use your identity provider.',
    login: 'Login',
    loading: 'Redirecting...',
    requirement: 'OIDC provider must be configured by the admin.',
    callbackTitle: 'Finishing login...',
    callbackDescription: 'Completing OIDC authentication.',
    callbackWaiting: 'Waiting for provider response.',
    logout: 'Logout',
  },
  pods: {
    title: 'Pods',
    description: 'High-performance pod list with virtualization and quick filters.',
    refresh: 'Refresh',
    loading: 'Loading pods…',
    unableToLoad: 'Unable to load pods',
    detailTitle: 'Pod Detail',
    summary: 'Summary',
    containers: 'Containers',
    conditions: 'Conditions',
    events: 'Events',
    filters: {
      search: 'Search',
      searchPlaceholder: 'Search by name, label, or node',
      namespace: 'Namespace',
      status: 'Status',
      allNamespaces: 'All namespaces',
      allStatuses: 'All statuses',
    },
    table: {
      name: 'Name',
      namespace: 'Namespace',
      status: 'Status',
      restarts: 'Restarts',
      age: 'Age',
      node: 'Node',
    },
  },
  nodes: {
    title: 'Nodes',
    description: 'Overview of cluster nodes. This view will be expanded with metrics and cordon/drain actions.',
    detailTitle: 'Node Detail',
    summary: 'Summary',
    conditions: 'Conditions',
  },
  deployments: {
    title: 'Deployments',
    description:
      'List of deployments with readiness information. Future iterations will add scale, rollout, and rollback actions.',
    detailTitle: 'Deployment Detail',
    summary: 'Summary',
    conditions: 'Conditions',
  },
  namespaces: {
    title: 'Namespaces',
    description: 'Namespace inventory. Future versions will add create/delete actions and labels.',
  },
  events: {
    title: 'Events',
    description: 'Cluster events',
    filter: 'Filter',
  },
}

export default enTranslation
export type TranslationSchema = typeof enTranslation

