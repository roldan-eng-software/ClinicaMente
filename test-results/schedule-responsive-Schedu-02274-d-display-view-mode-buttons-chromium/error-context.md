# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "ClínicaMente" [level=1] [ref=e4]
    - heading "Entrar" [level=2] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e8]: E-mail
        - textbox "E-mail" [ref=e9]
      - generic [ref=e10]:
        - generic [ref=e11]: Senha
        - textbox "Senha" [ref=e12]
      - button "Entrar" [ref=e13]
    - paragraph [ref=e14]:
      - text: Não tem uma conta?
      - link "Cadastrar" [ref=e15] [cursor=pointer]:
        - /url: /signup
  - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
    - img [ref=e22]
  - alert [ref=e25]
```