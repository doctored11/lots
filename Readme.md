🐔🫐💣
версия фронтенд
*реализованна первичная логика на фронте*


f1.0.0


//заметки ctrlC

перенос статики:
sudo rsync -a --remove-source-files /root/lots/frontend/dist/ /var/www/snullprojects.ru/
sudo systemctl reload nginx

логирование бекенда (realTimeLast)
 tail -f ~/.pm2/logs/index-out.log


 **ПОЕШЬ и сделай дезайбл на кнопках фронта когда надо.
 + вынеси адрес на /lots (перезод в игру с домашней страницы)
 + логика расчета выигрыша неверна (умножать надо не ставку а сумму остальных amount)
 + минимальный рефактор бекенда (slotsController)