#!/usr/bin/perl
# Gera decisoes_2026-09-27.md com transcricao VERBATIM (texto integral do JSON, sem cortes).
# uso: perl gera_decisoes.pl <be12a326...jsonl> > decisoes_2026-09-27.md
use strict; use warnings; use utf8;
use JSON::PP; use Digest::SHA qw(sha256_hex); use Encode qw(encode);
binmode STDOUT, ':encoding(UTF-8)';
my $file = $ARGV[0];
my $caminho = 'C:\\Users\\alqui\\.claude\\projects\\C--reviewbr\\be12a326-1306-43b3-a197-591af05c0876.jsonl';
my @blocos = (
  [253, '(a) Relatório completo do assistente (resposta ao pedido do Vicente de 02:04:46Z)', 'Assistente — Claude, sessão principal (type=assistant)'],
  [259, '(b) Mensagem do Vicente com as 11 decisões', 'Vicente (humano) — type=user, texto digitado'],
  [273, '(c) Mensagem do Vicente: parar por orçamento', 'Vicente (humano) — type=user, texto digitado'],
  [284, '(d) Relatório final do subagente a9b8c882ab32139bc (entregue como mensagem)', 'Subagente a9b8c882ab32139bc (saída de modelo, entregue pelo harness como entrada type=user; NÃO é fala do Vicente)'],
  [290, '(e) Resposta final do assistente', 'Assistente — Claude, sessão principal (type=assistant)'],
);
my @anexos = (
  [264, 'A1. Instrução enviada pela sessão principal ao subagente (SendMessage, 02:21:12Z) — define a numeração PASSO 1..11', 'Assistente — Claude, sessão principal (tool_use SendMessage, campo input.message)'],
  [278, 'A2. Instrução de parada enviada ao subagente (SendMessage, 02:25:13Z)', 'Assistente — Claude, sessão principal (tool_use SendMessage, campo input.message)'],
  [292, 'A3. Notificação de término do subagente (harness, 02:26:12.151Z)', 'Harness (task-notification, entrada type=user; não é fala do Vicente)'],
  [293, 'A4. Última mensagem do assistente na sessão (02:26:14Z)', 'Assistente — Claude, sessão principal (type=assistant)'],
);
my %want = map { $_->[0] => 1 } (@blocos, @anexos);
open my $fh, '<:encoding(UTF-8)', $file or die "nao abre $file: $!";
my $json = JSON::PP->new->allow_nonref;
my (%txt, %meta); my $ln = 0;
while (my $line = <$fh>) {
  $ln++; next unless $want{$ln};
  my $o = $json->decode($line);
  my $c = $o->{message}{content}; my $t = '';
  if (!ref $c) { $t = $c; }
  else {
    for my $x (@$c) {
      next unless ref $x eq 'HASH';
      my $xt = $x->{type} // '';
      if ($xt eq 'text') { $t .= $x->{text}; }
      elsif ($xt eq 'tool_use') { $t .= $x->{input}{message} // ''; }
    }
  }
  $txt{$ln} = $t;
  $meta{$ln} = { ts => $o->{timestamp}, uuid => $o->{uuid}, type => $o->{type} };
}
sub fence { my $s = shift; my $n = 4; while ($s =~ /(~{$n,})/) { $n = length($1) + 1; } return '~' x $n; }
sub bloco {
  my ($ln, $titulo, $autor) = @_;
  my $t = $txt{$ln}; my $m = $meta{$ln}; my $f = fence($t);
  my $sha = sha256_hex(encode('UTF-8', $t));
  print "\n---\n\n## $titulo\n\n";
  print "- Sessão: be12a326-1306-43b3-a197-591af05c0876 (`$caminho`, linha $ln do arquivo)\n";
  print "- Timestamp UTC: $m->{ts}\n";
  print "- Autor: $autor\n";
  print "- uuid da entrada: $m->{uuid}\n";
  print "- Tamanho do texto: ", length($t), " caracteres; SHA-256 (UTF-8): $sha\n\n";
  print "${f}text\n$t\n$f\n";
}
print "# Decisões de 27/09/2026 — transcrição verbatim da sessão be12a326\n\n";
print "Transcrição gerada por script (`gera_decisoes.pl`, nesta mesma pasta) diretamente do JSON da sessão, sem resumo e sem cortes. ";
print "Cada bloco reproduz o campo de texto integral da entrada indicada (mensagens do assistente: concatenação das partes `text`; mensagens gravadas como string: a string inteira, incluindo a moldura do harness). ";
print "O recuo de 2 espaços em cada linha do relatório do subagente, no bloco (d), é da moldura do harness e foi preservado como está gravado. ";
print "O SHA-256 permite conferir a fidelidade: reextrair o texto da mesma linha do .jsonl e recalcular o hash.\n";
print "\nReprodução: `perl gera_decisoes.pl /c/Users/alqui/.claude/projects/C--reviewbr/be12a326-1306-43b3-a197-591af05c0876.jsonl > decisoes_2026-09-27.md`\n";
bloco(@$_) for @blocos;
print "\n---\n\n# ANEXO — contexto adicional (não pedido nos itens a–e; incluído porque define a numeração PASSO 1..11 usada pelo subagente)\n";
bloco(@$_) for @anexos;
