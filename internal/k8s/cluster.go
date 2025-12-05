package k8s

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"

	"kubezen/internal/config"
)

// Cluster wires the Kubernetes clientset with informer factories.
type Cluster struct {
	Client  kubernetes.Interface
	Factory informers.SharedInformerFactory
}

func NewCluster(cfg config.KubeConfig) (*Cluster, error) {
	restConfig, err := buildRestConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("create rest config: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(restConfig)
	if err != nil {
		return nil, fmt.Errorf("create clientset: %w", err)
	}

	factory := newInformerFactory(clientset)

	return &Cluster{
		Client:  clientset,
		Factory: factory,
	}, nil
}

// Start runs the informer factory and waits for caches to sync.
func (c *Cluster) Start(ctx context.Context) error {
	if c == nil || c.Factory == nil {
		return errors.New("nil informer factory")
	}

	// Lazily instantiate informers before starting the factory; anything created
	// after Start won't run automatically.
	pods := c.Factory.Core().V1().Pods().Informer()
	nodes := c.Factory.Core().V1().Nodes().Informer()
	deployments := c.Factory.Apps().V1().Deployments().Informer()
	namespaces := c.Factory.Core().V1().Namespaces().Informer()
	events := c.Factory.Core().V1().Events().Informer()

	c.Factory.Start(ctx.Done())

	syncFuncs := []cache.InformerSynced{
		pods.HasSynced,
		nodes.HasSynced,
		deployments.HasSynced,
		namespaces.HasSynced,
		events.HasSynced,
	}

	if ok := cache.WaitForCacheSync(ctx.Done(), syncFuncs...); !ok {
		return errors.New("failed to sync informers before shutdown")
	}
	return nil
}

func buildRestConfig(cfg config.KubeConfig) (*rest.Config, error) {
	if cfg.KubeconfigPath != "" {
		return restConfigFromKubeconfig(cfg.KubeconfigPath, cfg)
	}

	// Try env KUBECONFIG if present
	if kubeconfig := os.Getenv("KUBECONFIG"); kubeconfig != "" {
		return restConfigFromKubeconfig(kubeconfig, cfg)
	}

	// Try default home kubeconfig
	if home := homedir.HomeDir(); home != "" {
		path := filepath.Join(home, ".kube", "config")
		if _, err := os.Stat(path); err == nil {
			return restConfigFromKubeconfig(path, cfg)
		}
	}

	// Fallback to in-cluster config
	inCluster, err := rest.InClusterConfig()
	if err == nil {
		applyClientTunables(inCluster, cfg)
		return inCluster, nil
	}

	return nil, fmt.Errorf("unable to load kubeconfig or in-cluster config: %w", err)
}

func restConfigFromKubeconfig(path string, cfg config.KubeConfig) (*rest.Config, error) {
	loadingRules := &clientcmd.ClientConfigLoadingRules{ExplicitPath: path}
	overrides := &clientcmd.ConfigOverrides{}
	if cfg.Context != "" {
		overrides.CurrentContext = cfg.Context
	}

	clientConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, overrides)
	restConfig, err := clientConfig.ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("load kubeconfig %s: %w", path, err)
	}

	applyClientTunables(restConfig, cfg)
	return restConfig, nil
}

func newInformerFactory(client kubernetes.Interface) informers.SharedInformerFactory {
	return informers.NewSharedInformerFactoryWithOptions(
		client,
		30*time.Second,
		informers.WithTransform(stripHeavyFields),
	)
}

func applyClientTunables(restConfig *rest.Config, cfg config.KubeConfig) {
	if cfg.QPS > 0 {
		restConfig.QPS = cfg.QPS
	}
	if cfg.Burst > 0 {
		restConfig.Burst = cfg.Burst
	}
	if cfg.InsecureSkipTLSVerify {
		// client-go izin vermez: Insecure=true iken CA set edilemez, bu yüzden temizliyoruz.
		restConfig.TLSClientConfig.Insecure = true
		restConfig.TLSClientConfig.CAFile = ""
		restConfig.TLSClientConfig.CAData = nil
	}
	restConfig.UserAgent = "kubezen-server"
}
