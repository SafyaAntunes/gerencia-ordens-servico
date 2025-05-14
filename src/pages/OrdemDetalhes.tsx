
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { LogoutProps } from "@/types/props";
import { OrdemDetalhesContent } from "@/components/ordens/ordem-detalhes";

interface OrdemDetalhesProps extends LogoutProps {}

export default function OrdemDetalhes({ onLogout }: OrdemDetalhesProps) {
  const { id } = useParams();

  return (
    <Layout onLogout={onLogout}>
      <OrdemDetalhesContent id={id} onLogout={onLogout} />
    </Layout>
  );
}
