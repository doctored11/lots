🐔🫐💣
версия фронтенд
_реализованна первичная логика на фронте_

f1.0.0

//заметки ctrlC

перенос статики:
sudo rsync -a --remove-source-files /root/lots/frontend/dist/ /var/www/snullprojects.ru/
sudo systemctl reload nginx

логирование бекенда (realTimeLast)
tail -f ~/.pm2/logs/index-out.log

\*\*
\*\*Обязательно!:

1.  в первую очередь:

- задезейбить кнопки ставки и смены машины во время анимацй смены машины! ✔️
- подтягивать цвет автомата и статистику при входе в приложение(а не только ленту) +-✔️[макс выигрыш остается старым]
- минимальное оформление главной страницы (посадить на грид и сделать просто квадратные ссылки на игры) ✔️
- проверить логику расчета выигрыша неверна (умножать надо не ставку а сумму остальных amount - вроде верно сейчас но не факт) ✔️
- минимальный рефактор бекенда (slotsController) ⚠️(отложенно пока что \ остановились тут )
/до 16:30

2.  во вторую очередь:

- еще приложение ГИфТЫ - которое раз во время (30мин) может дать рандомное число валюты от 5 до 250 [без графики ](вынести его из этого проекта лотов)
- начальная ставка в 10 монет всегда (подумать как сделать без конфликтов с changeMAshine)[мб просто по клику на руку без ставки делать минимальный бет]
- графика монет
- сделать спины чуть быстрее от 1,5 сек до 3.5 сек [постараться сделать одинаковую скорость на всех устройствах (сейчас визуально зависит от плотности физ пикселей)]

2.9 в Претретью:
- логика смены машины при ХП <=0  вращаем спин автомат исчезает(позже с анимацией взрыва, ставку просто забираем и выдаем бесплатно новый атовтомат) [пока только с анимацией появления]

3. в третью очередь:
- стили для слотов (центрировать все, вывести кнопки удобно, сделать чтоб ок выглядело на обоих темах ТГ)
- попробовать настроить как бы полноэкранное мини апп2, и задать или константные размеры телеграм приложения или макс ширину и высоту (для окна на компьютере)

3.9 в преЧетвертую очередь
- анимация взрыва

4. в четвертую очередь:
- еще однк "игру" просто таблицу рейтинга. (топ игроков, где все видят топ -имя и счет. счет внутри этой игры, одно очко покупается за 200 валюты)[то есть нужна таблица игры где есть id,idигрока(чатid), имя игрока, счет в игре] - просто лидерборд который видят все (для того чтоб можно было тратить хоть куда то валюты выигранную в слотах)

5. в пятую очередь:
- стили для лидерборда

6. в шестую очередь:
- графика и анимации для ГИФТОВ

7 Побочно не обязательно:
- тест и команды для ТГ бота вне мини аппа с получением статистик и приколов
- лоадер вместо загрузок


*второстепенные баги:
1) после смены машины и спина максимальный выигрыш откатывается к прошлым значениям а не к нулю (видно при перезаходе)