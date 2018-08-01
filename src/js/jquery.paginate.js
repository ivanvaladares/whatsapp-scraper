/*
 * This file is part of the dozoisch/paginator
 *
 * (C) 2013 Hugo Dozois-Caouette
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
/**
 * @author dozoisch
 * @version 1.2.3
 * @url github.com/dozoisch/paginator
 *
 * @param {object} $ jQuery library
 * @param {object} Math The Math library
 * @returns {object} Returns the table for chainability
 */
(function ($, Math) {
    "use strict";

    var prefix = 'paginate';

    var defaults = {
        'elemsPerPage': 5,
        'maxButtons': 5,
        //Css classes
        'disabledClass': prefix + 'Disabled',
        'activeClass': prefix + 'Active',
        'containerClass': prefix + 'Container',
        'listClass': prefix + 'List',
        'showAllListClass': prefix + 'ShowAllList',
        'previousClass': prefix + 'Previous',
        'nextClass': prefix + 'Next',
        'previousSetClass': prefix + 'PreviousSet',
        'nextSetClass': prefix + 'NextSet',
        'showAllClass': prefix + 'ShowAll',
        'pageClass': prefix + 'Page',
        'anchorClass': prefix + 'Anchor',
        //Text on buttons
        'previousText': '&laquo;',
        'nextText': '&raquo;',
        'previousSetText': '&hellip;',
        'nextSetText': '&hellip;',
        'showAllText': '&dArr;'
    };

    var methods = {
        init: function (options) {

            var table = $(this);
            if (table.data(prefix)) {
                return table;
            }
            var paginator = new Paginator(this, options);

            table.data(prefix, paginator);

            return this;
        },
        update: function (pageNumber, numRecords) {
            $(this).data(prefix).rebuild().showPage(pageNumber || 1);
            return this;
        },
        changeSettings: function (options, pageNumber) {
            $(this).data(prefix).updateConfig(options || {}).showPage(pageNumber || 1);
            return this;
        },
        destroy: function () {
            var elem = $(this);
            elem.data(prefix).showAll().destroy();
            elem.removeData(prefix);
            return this;
        }
    };

    $.fn.paginate = function (args) {
        var parameters = Array.prototype.slice.call(arguments, 1);
        return this.each(function () {
            if (methods[args]) {
                return methods[args].apply(this, parameters);
            } else if (typeof args === 'object' || !args) {
                return methods.init.apply(this, [args]);
            } else {
                $.error('Incorrect usage of jQuery.Paginate');
            }
        });
    };

    var Paginator = function (element, options) {
        var table = $(element);
        var config = $.extend({}, defaults, table.data() || {}, options || {});
        var container = null;

        this.getConfig = function () {
            return config;
        };
        this.getContainer = function () {
            return container;
        };
        this.getTable = function () {
            return table;
        };

        this.getSelector = function (name) {
            if ($.isArray(name)) {
                var response = '';
                for (var index in name) {
                    response += this.getSelector(name[index]);
                }
                return response;
            }
            return '.' + config[name + 'Class'];
        };

        this.updateConfig = function (settings) {
            config = $.extend(config, settings);
            return this.rebuild();
        };

        this.destroy = function () {
            container.remove();
            return table;
        };
        this.rebuild = function () {
            this.destroy();
            return this.build();
        };
        this.build = function () {
            container = new Builder(this);
            table.after(container);
            return this;
        };
        this.build();
        this.showPage(1);
    };

    Paginator.prototype.previousPage = function () {
        var previousPageNumber = parseInt(
            this.getContainer().find(this.getSelector(['page', 'active'])).children('a').text(), 10) - 1;
        if (isNaN(previousPageNumber)) {
            previousPageNumber = 1;
        }
        this.showPage(previousPageNumber);
        return this;
    };

    Paginator.prototype.nextPage = function () {
        var nextPageNumber = parseInt(this.getContainer().find(
            this.getSelector(['page', 'active'])).children('a').text(), 10) + 1;
        if (isNaN(nextPageNumber)) {
            nextPageNumber = 1;
        }
        this.showPage(nextPageNumber);
        return this;
    };

    Paginator.prototype.previousSet = function () {
        var previousPage = parseInt(this.getContainer().find(
            this.getSelector('page')).filter(visibleFilter).first().children('a').text(), 10) - 1;
        this.showSet(previousPage);
        return this;
    };

    Paginator.prototype.nextSet = function () {
        var nextPage = parseInt(this.getContainer().find(
            this.getSelector('page')).filter(visibleFilter).last().children('a').text(), 10) + 1;
        this.showSet(nextPage);
        return this;
    };

    Paginator.prototype.showAll = function () {
        var config = this.getConfig();
        var container = this.getContainer();
        this.getTable().find('tbody tr').show();

        container.find(this.getSelector('active')).removeClass(config['activeClass']);
        container.find(this.getSelector('showAll')).addClass(config['activeClass']);
        container.find(this.getSelector('previous')).addClass(config['disabledClass']);
        container.find(this.getSelector('next')).addClass(config['disabledClass']);

        return this;
    };

    /**
     *
     * @param {int} pageNumber 1indexed
     * @returns {_L1.Paginator.prototype}
     */
    Paginator.prototype.showPage = function (pageNumber) {

        var config = this.getConfig();
        var container = this.getContainer();
        var tableTr = this.getTable().find('tbody tr');
        var maxPageNumber = Math.ceil(tableTr.length / config['elemsPerPage']);

        if (maxPageNumber === 0) {
            container.find(this.getSelector('previous')).addClass(config['disabledClass']);
            container.find(this.getSelector('next')).addClass(config['disabledClass']);
            container.find(this.getSelector('showAll')).addClass(config['disabledClass']);
            return this;
        } else if (pageNumber > maxPageNumber) {
            pageNumber = maxPageNumber;
        } else if (pageNumber < 1) {
            pageNumber = 1;
        }

        container.find(this.getSelector('disabled')).removeClass(config['disabledClass']);
        if (pageNumber === 1) {
            container.find(this.getSelector('previous')).addClass(config['disabledClass']);
        }
        if (pageNumber === maxPageNumber) {
            container.find(this.getSelector('next')).addClass(config['disabledClass']);
        }

        var zeroIndexPN = pageNumber - 1;

        container.find(this.getSelector('active')).removeClass(config['activeClass']);
        container.find(this.getSelector('page')).eq(zeroIndexPN).addClass(config['activeClass']);

        tableTr.hide();

        var firstRow = (zeroIndexPN) * config['elemsPerPage'];
        var lastRow = firstRow + config['elemsPerPage'];

        tableTr.filter(':eq(' + firstRow + '),:lt(' + lastRow + '):gt(' + firstRow + ')').show();

        //Adjust the set
        this.showSet(pageNumber);

        return this;
    };

    /**
     *
     * @param {integer} pageNumber 1 indexed.
     * @returns {_L1.Paginator.prototype}
     */
    Paginator.prototype.showSet = function (pageNumber) {
        var config = this.getConfig();
        var container = this.getContainer();

        // Zero Indexed
        --pageNumber;
        var numberOfPage = Math.ceil(this.getTable().find('tbody tr').length / config['elemsPerPage']) - 1;
        // 2 buttons (previous, next sets) + 1 the first button
        var maxButtons = config['maxButtons'] - 3;

        var firstPageToShow = Math.ceil(pageNumber - maxButtons / 2);
        var lastPageToShow = firstPageToShow + maxButtons;

        container.find(this.getSelector('previousSet')).show();
        container.find(this.getSelector('nextSet')).show();

        if (firstPageToShow <= 1) {
            ++maxButtons;
            firstPageToShow = 0;
            lastPageToShow = firstPageToShow + maxButtons;
            container.find(this.getSelector('previousSet')).hide();
        } else if (lastPageToShow >= (numberOfPage - 1)) {
            ++maxButtons;
            lastPageToShow = numberOfPage;
            firstPageToShow = (numberOfPage > maxButtons) ? numberOfPage - maxButtons : 0;
            container.find(this.getSelector('nextSet')).hide();
        }

        var pages = container.find(this.getSelector('page'));
        pages.hide();

        pages.filter(':eq(' + firstPageToShow + '),:eq(' + lastPageToShow + ')' +
            ',:lt(' + lastPageToShow + '):gt(' + firstPageToShow + ')').show();
        return this;
    };

    var Builder = function (paginate) {
        var config = paginate.getConfig();
        var container = paginate.getContainer();

        var create = function (name, attr) {
            if (typeof attr === 'string') {
                attr = {'class': attr};
            }
            return $('<' + name + '>', attr || {});
        };

        var createLi = function (type, content) {
            return create('li', {
                'class': config[type + 'Class'],
                'html': create('a', {
                    'class': config.anchorClass,
                    'html': content || config[type + 'Text']
                })
            });
        };

        var tableLength = paginate.getTable().find('tbody tr').length;
        var numberOfPage = Math.ceil(tableLength / config.elemsPerPage);


        var inNeedOfSetButtons = false;
        if (numberOfPage > config.maxButtons) {
            inNeedOfSetButtons = true;
        }

        container = create('div', config.containerClass);
        var index = 0, list = new Array(numberOfPage + inNeedOfSetButtons * 2 + 2);

        list[index++] = createLi('previous').click(function (e) {
            e.preventDefault();
            paginate.previousPage.apply(paginate);
        });

        if (inNeedOfSetButtons) {
            list[index++] = createLi('previousSet').click(function (e) {
                e.preventDefault();
                paginate.previousSet.apply(paginate);
            });
        }

        var pageButtonClick = function (e) {
            e.preventDefault();
            paginate.showPage.apply(paginate, [parseInt($(this).text(), 10)]);
        };

        for (var i = 1; i <= numberOfPage; i++) {
            list[index++] = createLi('page', i).click(pageButtonClick);
        }

        if (inNeedOfSetButtons) {
            list[index++] = createLi('nextSet').click(function (e) {
                e.preventDefault();
                paginate.nextSet.apply(paginate);
            });
        }

        list[index++] = createLi('next').click(function (e) {
            e.preventDefault();
            paginate.nextPage.apply(paginate);
        });


		var listObj = create('ul', config.listClass);
		listObj.append(list);
		listObj.append("<div>" + tableLength + " registros encontrados</div>")

		container.append(listObj);
        // container.append(
        //     [
        //         listObj,
        //         create('ul', config['showAllListClass']).append(
        //             // createLi('showAll').click(function (e) {
		// 			// 	e.preventDefault();
		// 			// 	paginate.showAll.apply(paginate);
		// 			// })
		// 		)
        //     ]);
        return container;
    };

    var visibleFilter = function () {
        return $(this).css('display') !== 'none';
    };

}(jQuery, Math));