# Como Atualizar o Código no GitHub

## Situação Atual:
- ✅ Código atualizado está no seu PC (pasta glide-store-spark-main)
- ❌ O repositório no GitHub não existe ou está com nome diferente

## Opção 1: Criar o Repositório no GitHub (Recomendado)

### Passo 1: Criar o repositório
1. Acesse: https://github.com/new
2. Nome do repositório: `glide-store-spark`
3. Escolha: Público ou Privado
4. **NÃO marque** nenhuma opção (README, .gitignore, license)
5. Clique em "Create repository"

### Passo 2: Fazer Push
Abra o terminal na pasta `glide-store-spark-main` e execute:

```bash
git push -u origin main
```

Se pedir autenticação, use seu token do GitHub ou faça login.

## Opção 2: Se o Repositório Já Existe com Nome Diferente

Se o repositório já existe mas com outro nome, atualize o remote:

```bash
cd glide-store-spark-main
git remote set-url origin https://github.com/Anamariabraga100/NOME_DO_REPOSITORIO.git
git push -u origin main
```

## Opção 3: Forçar Push (Substituir Código Antigo)

Se o repositório existe mas você quer substituir tudo:

```bash
cd glide-store-spark-main
git push -u origin main --force
```

⚠️ **Cuidado**: Isso vai substituir todo o código no GitHub!

## Verificar Status Atual

Para ver o que está commitado localmente:

```bash
cd glide-store-spark-main
git log --oneline
```

Você deve ver:
- "Atualização: Tiktokshop - Otimizações de performance, novas imagens e melhorias de UX"
- "Adiciona instruções para push no GitHub"




