# Auréllé Beauty — Homepage UI (first frontend slice)

## Included files

Copy these files into the existing project:

- `client/src/App.jsx`
- `client/src/App.css`
- `client/src/index.css`

No package installation is required. The existing `lucide-react` dependency is used.

## Run

From `client/`:

```bash
npm run dev
```

## Notes

- The homepage includes responsive navigation, search over the sample editorial cards, saved-item toggles, an empty shopping-bag drawer, and a newsletter confirmation interaction.
- The four product cards and category/hero photographs are visual starter content only. They are not live inventory and are not connected to checkout.
- The next integration step is to replace `featuredEdits` with the response from `GET /api/v1/products`, then wire product detail, authentication, cart, and checkout to the existing API.
- Images and Google Fonts are loaded from external URLs. A network connection is required for them to appear as intended.
- No secrets or environment files are included in this bundle.
