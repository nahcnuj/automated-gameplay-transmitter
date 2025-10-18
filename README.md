# Automated Gameplay Transmitter

```sh
# Start a display server
nohup bun start &>>./var/screen.log &

# Start my speaking bot
nohup ./bin/bot &>>./var/bot.log &

# Start OBS Studio
nohup ./bin/obs &>>./var/obs.log &
```

## Dependencies

This application uses the following software(s) in addition to dependencies in `package.json`:
- [Open JTalk](https://open-jtalk.sourceforge.net/)
- [OBS Studio](https://obsproject.com/ja)
- [Bun](https://bun.com/)
- 配信者のためのコメントアプリ「わんコメ」https://onecomme.com

See also [init.dash](./init.dash) without any warranty of reproducibility.