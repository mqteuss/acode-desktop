# ACode

ACode é um aplicativo desktop para Windows que conecta o ChatGPT a projetos locais autorizados, permitindo inspecionar arquivos, aplicar alterações, executar testes e acompanhar evidências de forma controlada.

## Download

Baixe sempre pela página de Releases deste repositório:

- **Instalador:** `ACode-Setup-x64.exe`
- **Portable:** `ACode-Portable-x64.exe`
- **Integridade:** `SHA256SUMS.txt`

Site oficial: publicado pela Vercel a partir deste repositório.

## Segurança

Antes de executar um download, compare o SHA-256 do arquivo com `SHA256SUMS.txt` da mesma release.

```powershell
Get-FileHash .\ACode-Setup-x64.exe -Algorithm SHA256
```

O ACode só deve receber acesso às pastas que você escolher explicitamente. Não publique URLs MCP, tokens, credenciais ou arquivos `.env`.

Consulte [SECURITY.md](SECURITY.md) para relatar problemas de segurança.

## Sobre este repositório

Este é o repositório público de distribuição do ACode. Ele contém apenas:

- site oficial;
- documentação pública essencial;
- metadados necessários para deploy na Vercel;
- releases compiladas publicadas na seção **Releases**.

O código-fonte do aplicativo desktop não é publicado aqui.

## Autoria

Criado por [@mqteus07](https://x.com/mqteus07) com ACode/ChatGPT.
