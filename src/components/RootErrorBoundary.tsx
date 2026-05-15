 import { Component, ReactNode } from 'react';
 
 interface Props {
   children: ReactNode;
 }
 
 interface State {
   hasError: boolean;
   error: Error | null;
 }
 
 export class RootErrorBoundary extends Component<Props, State> {
   constructor(props: Props) {
     super(props);
     this.state = { hasError: false, error: null };
   }
 
   static getDerivedStateFromError(error: Error) {
     // Se for o erro de removeChild (comum com extensões de tradução ou libs de terceiros)
     // tentamos um auto-recovery marcando para recarregar silenciosamente ou apenas ignorar o crash total
     if (error.message?.includes('removeChild') || error.message?.includes('insertBefore')) {
       return { hasError: true, error, isDOMError: true };
     }
     return { hasError: true, error, isDOMError: false };
   }
 
   componentDidCatch(error: Error, info: any) {
     console.error('App error:', error, info);
   }
 
   componentDidUpdate(_prevProps: Props, prevState: State) {
     // Se for um erro de DOM (removeChild), recarregamos a página automaticamente após um curto delay
     // Isso resolve o problema sem o usuário precisar clicar em nada
     if (this.state.hasError && !prevState.hasError && (this.state as any).isDOMError) {
       console.warn("DOM node error detected. Attempting auto-recovery via reload...");
       setTimeout(() => {
         window.location.reload();
       }, 500);
     }
   }

   render() {
     if (this.state.hasError && !(this.state as any).isDOMError) {
       return (
         <div style={{
           padding: '20px',
           fontFamily: 'sans-serif',
           textAlign: 'center',
            backgroundColor: '#1a1f2e',
            color: '#fff',
           height: '100vh',
           display: 'flex',
           flexDirection: 'column',
           justifyContent: 'center',
           alignItems: 'center'
         }}>
            <h2 style={{ color: '#fff' }}>Algo deu errado</h2>
           <p>O aplicativo encontrou um erro. Tente:</p>
            <ol style={{ textAlign: 'left', display: 'inline-block', marginBottom: '20px' }}>
             <li>Atualizar a página (botão refresh)</li>
             <li>Fechar e abrir o app novamente</li>
             <li>Atualizar o Chrome do seu celular</li>
            </ol>
            <p style={{ fontSize: '12px', marginTop: '20px', color: '#888' }}>
              Detalhe técnico: {this.state.error?.message}
            </p>
           <button
             onClick={() => window.location.reload()}
             style={{
               padding: '12px 24px',
               background: '#1E5BB8',
               color: '#fff',
               border: 'none',
               borderRadius: '4px',
               fontSize: '16px',
               cursor: 'pointer'
             }}
           >
             Recarregar
           </button>
         </div>
       );
     }
     return this.props.children;
   }
 }