# Layout Example

This example demonstrates the three-panel stream overlay layout provided by
[automated-gameplay-transmitter](https://github.com/nahcnuj/automated-gameplay-transmitter).

## Layout

![Layout Example](layout-example.png)

| Panel | Grid area | Text shown in the image |
|-------|-----------|-------------------------|
| Main | `col-span-8 / row-span-8` | 🎮 **Game Screen** |
| Side | `col-span-2 / row-span-8` | **Streamer** · Session 1 · (Day 1) · Score: 1.23e+9 · Items: 42 · 1,234 👥 · 00:42:00 🕧 |
| Bottom | `col-span-10 / row-span-2` | 🙂 *Hello, viewers! Thanks for watching the stream today!* |

## Requirements

- [Bun](https://bun.sh) ≥ 1.1

## Getting Started

```sh
# Install dependencies (from the example directory)
bun install

# Start the development server
bun dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.
