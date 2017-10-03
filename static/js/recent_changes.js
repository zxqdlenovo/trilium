$(document).bind('keydown', 'alt+r', function() {
    $("#recentChangesDialog").dialog({
        modal: true,
        width: 400,
        height: 700
    });

    $.ajax({
        url: baseApiUrl + 'recent-changes/',
        type: 'GET',
        success: function (result) {
            const groupedByDate = new Map();
            const dayCache = {};

            for (const row of result) {
                if (row.encryption > 0) {
                    if (isEncryptionAvailable()) {
                        row.note_title = decryptString(row.note_title);
                    }
                    else {
                        row.note_title = "[encrypted]";
                    }
                }


                let dateDay = getDateFromTS(row.date_modified);
                dateDay.setHours(0);
                dateDay.setMinutes(0);
                dateDay.setSeconds(0);
                dateDay.setMilliseconds(0);

                // this stupidity is to make sure that we always use the same day object because Map uses only
                // reference equality
                if (dayCache[dateDay]) {
                    dateDay = dayCache[dateDay];
                }
                else {
                    dayCache[dateDay] = dateDay;
                }

                if (!groupedByDate.has(dateDay)) {
                    groupedByDate.set(dateDay, []);
                }

                groupedByDate.get(dateDay).push(row);
            }

            for (const [dateDay, dayChanges] of groupedByDate) {
                const changesListEl = $('<ul>');

                const dayEl = $('<div>').append($('<b>').html(formatDate(dateDay))).append(changesListEl);

                for (const change of dayChanges) {
                    const formattedTime = formatTime(getDateFromTS(change.date_modified));

                    const noteLink = $("<a>", {
                        href: 'app#' + change.note_id,
                        text: change.note_title
                    });

                    const revLink = $("<a>", {
                        href: "javascript: showNoteHistoryDialog('" + change.note_id + "', " + change.id + ");",
                        text: 'rev'
                    });

                    changesListEl.append($('<li>')
                        .append(formattedTime + ' - ')
                        .append(noteLink)
                        .append(' (').append(revLink).append(')'));
                }

                $("#recentChangesDialog").append(dayEl);
            }
        },
        error: () => alert("Error getting recent changes.")
    });
});

$(document).on('click', '#recentChangesDialog a', function(e) {
    goToInternalNote(e, () => {
        $("#recentChangesDialog").dialog('close');
    });
});