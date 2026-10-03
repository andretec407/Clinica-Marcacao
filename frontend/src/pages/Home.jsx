import { Link } from 'react-router-dom'
import './Home.css'

export function Home() {
  return (
    <div className="container page home-page">
      <section className="home-hero">
        <div className="home-hero-art" aria-hidden="true">
          <span className="home-orbit home-orbit-one" />
          <span className="home-orbit home-orbit-two" />
          <span className="home-art-cross">+</span>
        </div>

        <div className="home-hero-content">
          <span className="home-eyebrow">NASSAU · ATENDIMENTO EM SAÚDE</span>
          <h1>Mais clareza em cada etapa do seu atendimento.</h1>
          <p>Solicite seus exames, acompanhe a confirmação e saiba o que acontece da chegada à coleta.</p>

          <div className="home-actions">
            <Link className="home-button home-button-light" to="/login">
              Solicitar exame <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <span className="home-hero-note">Cuidado bem orientado começa na chegada.</span>
      </section>

      <section className="home-intro">
        <div>
          <span className="home-eyebrow home-eyebrow-dark">UMA JORNADA MAIS TRANQUILA</span>
          <h2>O atendimento flui quando cada etapa faz sentido.</h2>
        </div>
        <p>Do primeiro ticket à chamada no guichê, cada detalhe ajuda a reduzir dúvidas, organizar prioridades e deixar a equipe mais perto do que importa: as pessoas.</p>
      </section>

      <section className="home-benefits" aria-label="Recursos do Nassau Tickets">
        <article className="home-benefit home-benefit-featured">
          <span className="home-index">01 / CHEGADA</span>
          <h3>Uma entrada sem barreiras.</h3>
          <p>Emissão de senha rápida e anônima, direto no totem.</p>
          <span className="home-benefit-mark" aria-hidden="true">+</span>
        </article>

        <article className="home-benefit home-benefit-dark">
          <span className="home-index">02 / ORGANIZAÇÃO</span>
          <h3>Prioridade que respeita a regra.</h3>
          <p>O ciclo de atendimento orienta a fila com consistência.</p>
        </article>

        <article className="home-benefit home-benefit-soft">
          <span className="home-index">03 / CONFIANÇA</span>
          <h3>Informação para seguir em frente.</h3>
          <p>Chamadas e tempos registrados para uma operação acompanhável.</p>
        </article>
      </section>

      <section className="home-journey">
        <div className="home-journey-image-wrap">
          <div className="home-journey-art" aria-hidden="true">
          </div>
          <span>UM FLUXO, DO INÍCIO AO FIM</span>
        </div>

        <div className="home-journey-copy">
          <span className="home-eyebrow home-eyebrow-dark">PARA QUEM ESPERA E PARA QUEM ATENDE</span>
          <h2>Todo mundo sabe qual é o próximo passo.</h2>
          <p>O painel mostra as chamadas recentes sem antecipar a próxima senha. A equipe acompanha a fila e atende em qualquer guichê, com registro de cada etapa.</p>
        </div>
      </section>
    </div>
  )
}
